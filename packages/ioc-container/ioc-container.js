/*global IocContainer, variadicNew*/
let functionToString = Function.prototype.toString;
let hasOwnProperty = Object.prototype.hasOwnProperty;

function readProp(o, prop) {
  return typeof o[prop] === 'function' ? o[prop]() : o[prop];
}

class Config {
  constructor(parentConfig) {
    this._cache = {};
    this._parentConfig = parentConfig;
  }

  // get(key)
  // get(key, defaultValue)
  get(key, defaultValue = undefined) {
    let saved = this._cache[key];
    if (this._parentConfig) {
      return saved === undefined ?
        this._parentConfig(key, defaultValue) : saved;
    } else {
      return saved === undefined ? defaultValue : saved;
    }
  }

  // set(map)
  // set(key, value)
  set(key, value) {
    if (typeof key === 'string') {
      this._cache[key] = value;
    } else {
      let map = key;
      for (let k in map) {
        if (hasOwnProperty.call(map, k)) {
          this._cache[k] = map[k];
        }
      }
    }
  }

  exists(key) {
    return key in this._cache ||
      (this._parentConfig && this._parentConfig.exists(key));
  }

  keys() {
    let keys = [];
    for (let key in this._cache) {
      keys.push(key);
    }
    return keys;
  }

  clear() {
    this._cache = {};
  }

  toJSON() {
    return JSON.stringify(this._cache);
  }

  valueOf() {
    return JSON.parse(this.toJSON());
  }
}

IocContainer = class {
  constructor(parentContainer) {
    this._models = {};
    this._predicatedConcerns = [];
    this._resolveStack = [];
    this.parentContainer = parentContainer;
    // Instances created from the parent container that this container
    // is directly managing. This does not include the instances created
    // by the parent container but are being tracked as a dependency of
    // an instance we track via the _models[].instances array.
    // Instances are added to this array by resolving directly via a resolve()
    // call on our container AND the resolution takes place on the parent
    // container (i.e. ioc.resolve() instead of being injected as a dependency).
    // NOTE: Any singleton instances created by our parent container MUST be
    // released by calling dispose() on the parent container as usual.
    this._parentContainerInstances = [];
    this._callbacks = {};
    this.config = new Config(this.parentContainer ?
      this.parentContainer.config : null);

    if (this.parentContainer) {
      this.parentContainer.on('dispose', () => {
        this.dispose();
      });
    }

    this.factory('$config', () => this.config.valueOf());
  }

  service(name, Ctor, {transient, concerns, inject, initializable, destroyable} = {}) {
    if (typeof Ctor !== 'function') throw new Error('Constructor needs to be a function.');

    let model = this._models[name] = this._models[name] || {};
    model.instances = [];
    model.service = true;
    model.factory = false;
    model.constant = false;

    model.transient = !!(transient === undefined ?
      readProp(Ctor, 'transient') : transient);
    model.initializable = !!(initializable === undefined ?
      readProp(Ctor, 'initializable') : initializable);
    model.destroyable = !!(destroyable === undefined ?
      readProp(Ctor, 'destroyable') : destroyable);

    inject = inject === undefined ?
      readProp(Ctor, 'inject') : inject;

    model.handler = () => this.injectNewable(Ctor, { deps: inject });

    if (concerns) {
      this.addLifecycleConcern(name, concerns);
    }
  }

  factory(name, fn, {transient, concerns, inject, initializable, destroyable} = {}) {
    if (typeof fn !== 'function') throw new Error('Factory needs to be a function.');

    let model = this._models[name] = this._models[name] || {};
    model.instances = [];
    model.service = false;
    model.factory = true;
    model.constant = false;

    model.transient = !!(transient === undefined ?
      readProp(fn, 'transient') : transient);
    model.initializable = !!(initializable === undefined ?
      readProp(fn, 'initializable') : initializable);
    model.destroyable = !!(destroyable === undefined ?
      readProp(fn, 'destroyable') : destroyable);

    inject = inject === undefined ?
      readProp(fn, 'inject') : inject;

    model.handler = () => this.inject(fn, { deps: inject });

    if (concerns) {
      this.addLifecycleConcern(name, concerns);
    }
  }

  constant(name, obj) {
    let model = this._models[name] = this._models[name] || {};
    model.instances = [];
    model.newable = false;
    model.service = false;
    model.factory = false;
    model.constant = true;
    model.transient = false;
    model.initializable = false;
    model.destroyable = false;
    model.handler = () => obj;
  }

  install(name, obj, {transient, newable, concerns, inject} = {}) {
    throw new Error('IocContainer#install() is deprecated. Use service(), factory() or constant().');
  }

  canResolve(name) {
    return name in this._models ||
      (name.charAt(0) === '$' && this.config.exists(name.substr(1))) ||
      (this.parentContainer && this.parentContainer.canResolve(name));
  }

  resolve(name) {
    try {
      // Resolve as config property.
      // Config properties can be referenced like '$propertyName'.
      // This is just a shorthand for resolving properties like this:
      // ioc.config.get('propertyName');
      //
      // $config is a special service that is the entire config object.
      if (name.indexOf('$') === 0 && name !== '$config') {
        let value = this.config.get(name.substr(1));
        if (value === undefined) {
          let error = new Error(`Config property "${name.substr(1)}" not found.`);
          error.name = 'NotFound';
          throw error;
        }
        return value;
      }

      // Perform normal resolution.
      if (name in this._models) {
        let model = this._models[name];
        let instances = model.instances;
        let handler = model.handler;

        // transient or first singleton
        if (model.transient || instances.length === 0) {
          let instance = { name: name, deps: [] };
          this._resolveStack.push(instance);
          instance.value = handler();
          instances.push(instance);
          this._resolveStack.pop();

          this._applyLifecycleConcern(model, instance, 'initializing');

          if (model.initializable &&
            typeof instance.value.initialize === 'function') {
            instance.value.initialize();
          }

          this._applyLifecycleConcern(model, instance, 'create');
        }

        let instance = instances[instances.length - 1];
        let scope = this._resolveStack[this._resolveStack.length - 1];
        if (scope) scope.deps.push(instance);

        return instance.value;
      } else {
        let error = new Error(`Service "${name}" not found.`);
        error.name = 'NotFound';
        throw error;
      }
    } catch (error) {
      // If the error is not one of our own then rethrow it.
      if (error.name !== 'NotFound') throw error;
      // If we have a parent IOC Container then we relay this
      // resolve call to them, otherwise we rethrow the error.
      if (this.parentContainer) {
        let instance = { name: name, deps: [] };
        instance.value = this.parentContainer.resolve(name);

        let scope = this._resolveStack[this._resolveStack.length - 1];
        if (scope) {
          scope.deps.push(instance);
          // Release override.
          instance.release = () => {
            this.parentContainer.release(instance.value);
          };
        } else {
          this._parentContainerInstances.push(instance);
        }

        return instance.value;
      } else {
        throw error;
      }
    }
  }

  release(instance) {
    return this._release(
      (inst) => inst.value === instance,
      { transient: true }
    );
  }

  addLifecycleConcern(nameOrPredicate, {initializing, create, destroy} = {}) {
    if (initializing || create || destroy) {
      if (typeof nameOrPredicate === 'string') {
        let name = nameOrPredicate;
        let model = this._models[name] = this._models[name] || {};
        let concerns = model.concerns = model.concerns || [];
        concerns.push({
          initializing: typeof initializing == 'function' ? initializing : null,
          create: typeof create == 'function' ? create : null,
          destroy: typeof destroy == 'function' ? destroy : null
        });
      } else if (typeof nameOrPredicate === 'function') {
        this._predicatedConcerns.push({
          predicate: nameOrPredicate,
          initializing: typeof initializing == 'function' ? initializing : null,
          create: typeof create == 'function' ? create : null,
          destroy: typeof destroy == 'function' ? destroy : null
        });
      }
    }
  }

  // inject(fn, { deps })
  // {private} inject(fn, { deps, wrapper })
  inject(fn, { deps, wrapper } = {}) {
    if (typeof fn === 'function') {
      if (fn.length > 0) {
        deps = deps || (typeof fn.inject === 'function' ?
          fn.inject() : fn.inject);
        if (!Array.isArray(deps)) {
          deps = functionToString.call(fn)
            .match(/function[^(]+\(([^)]*)\)/)[1]
            .split(',').map((s) => s.replace(/^\s+|\s+$/, ''));
        }

        let resolvedDeps = deps.map(this.resolve.bind(this)).slice(0, fn.length);
        return wrapper ? wrapper(fn, ...resolvedDeps) : fn(...resolvedDeps);
      } else {
        return wrapper ? wrapper(fn) : fn();
      }
    }

    return fn;
  }

  injectNewable(Newable, { deps } = {}) {
    return this.inject(Newable, { deps: deps, wrapper: variadicNew });
  }

  dispose() {
    // release singletons first
    this._release(null, { transient: false });
    // release left over transients last
    this._release(null, { transient: true });
    // empty out our models
    this._models = {};
    // empty our predicated concerns
    this._predicatedConcerns = [];
    // empty out our config
    this.config.clear();
    // release any instances that are being tracked by our parent container
    // directly.
    while (this._parentContainerInstances.length) {
      this.parentContainer.release(
        this._parentContainerInstances.pop().value
      );
    }
    // null out our parent IOC Container
    this.parentContainer = null;
    // call the 'dispose' callbacks
    let list = this._callbacks.dispose;
    if (list) {
      for (let callback of list) {
        callback();
      }
    }
    // clear all callbacks
    this._callbacks = {};
  }

  on(eventType, callback) {
    let list = this._callbacks[eventType] || [];
    list.push(callback);
    this._callbacks[eventType] = list;

    return {
      off() {
        // Make off a noop.
        this.off = function () {};
        list.splice(list.indexOf(callback), 1);
      }
    };
  }

  // Private helper function used to apply a lifecycle concern.
  _applyLifecycleConcern(model, instance, concern) {
    let concerns = model.concerns || [];

    for (let concernObj of concerns) {
      if (typeof concernObj[concern] === 'function') {
        concernObj[concern](instance.value, model);
      }
    }

    for (let concernObj of this._predicatedConcerns) {
      if (typeof concernObj[concern] === 'function' &&
        concernObj.predicate(instance.value, model) === true) {
        concernObj[concern](instance.value, model);
      }
    }
  }

  // Private helper function used to release instances.
  _release(predicate, {transient} = {}) {
    let released = false;

    for (let name in this._models) {
      let model = this._models[name];
      let instances = model.instances;

      if (instances && model.transient === !!transient) {
        for (let j = instances.length - 1; j >= 0; j -= 1) {
          let instance = instances[j];

          if (!predicate || predicate(instance)) {
            instances.splice(j, 1);

            // If the instance has a release method then we call it directly.
            // The only time instances should have their own release method is
            // when they have been created by our parent container.
            if (instance.release) {
              instance.release();
            } else {
              this._applyLifecycleConcern(model, instance, 'destroy');

              if (model.destroyable &&
                typeof instance.value.destroy === 'function') {

                instance.value.destroy();
              }
            }

            while (instance.deps.length) {
              let dep = instance.deps.pop();
              if (dep.name in instance.value) instance.value[dep.name] = null;
              for (let key in instance.value) {
                if (instance.value[key] === dep.value) {
                  instance.value[key] = null;
                }
              }
              this._release((inst) => inst === dep, { transient: true });
            }

            if (predicate) {
              released = true;
              break;
            }
          }
        }
      }
    }

    return predicate ? released : undefined;
  }
}