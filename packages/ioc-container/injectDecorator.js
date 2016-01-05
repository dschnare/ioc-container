/*global IocContainer, inject*/
function injectDecorator(deps, service) {
  if (arguments.length === 2) {
    if (typeof service === 'function') {
      service.inject = deps;
    }
    return service;
  // Assume ES7 decorator syntax used.
  } else {
    return injectDecoratorES7(deps);
  }
}

function injectDecoratorES7(deps) {
  return function (target, key, { value: fn, configurable, enumerable } = {}) {
    // Property descriptor
    if (arguments.length === 3) {
      if (typeof fn === 'function') {
        fn.inject = deps;
        return {
          configurable: true,
          enumerable: enumerable,
          value: fn
        };
      } else {
        return {
          configurable: configurable,
          enumerable: enumerable,
          value: fn
        };
      }
    // A function or constructor
    } else if (typeof target === 'function') {
      target.inject = deps;
    }

    return target;
  };
}


IocContainer.inject = injectDecorator;

if (typeof inject === 'undefined') {
  inject = injectDecorator;
}


// Override IocContainer#install() and add a lifecycle concern that
// will override each method on every service that has an `inject` property.
let install = IocContainer.prototype.install;
let lifecycleAdded = false;
IocContainer.prototype.install = function (name, o, opts) {
  install.call(this, name, o, opts);
  if (lifecycleAdded) return;
  lifecycleAdded = true;

  // Overridde each method that has dependencies it wants to inject.
  let ioc = this;
  this.addLifecycleConcern(
    () => true, // apply to every service
    {
      initializing(inst, model) {
        for (let key in inst) {
          let method = inst[key];
          if (typeof method === 'function' &&
            Array.isArray(method.inject)) {
            inst[key] = function () {
              ioc._resolveStack.push(model);
              let inst = ioc.inject(method.bind(this), {
                deps: method.inject
              });
              ioc._resolveStack.pop();
              return inst;
            };
          }
        }
      }
    }
  );
};