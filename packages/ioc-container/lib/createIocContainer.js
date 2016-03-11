const LifecycleType = {
  instance: 'instance',
  singleton: 'singleton',
  transient: 'transient'
}
const ErrorMessages = {
  DESTROYED: 'Ioc container has been destroyed. No method invocations are permitted.'
}
const LOCK = {}

/**
 * Creates a new inversion of control container.
 */
createIocContainer = function (parent) {
  let registry = {}
  let scopes = []
  let destroyed = false
  let self = null
  let id = '@' + (new Date()).getTime()

  const addToCurrentScope = (instance) => {
    if (scopes.length) scopes[scopes.length - 1].push(instance)
  }

  const lookupServiceEntryByInstance = (instance) => {
    for (let key in registry) {
      if (registry[key].instances.contains(instance)) return registry[key]
    }
  }

  const isInstanceDependedOn = (instance) => {
    for (let key in registry) {
      let entry = registry[key]

      for (let instEntry of entry.instances.values()) {
        if (instEntry.scope.indexOf(instance) >= 0) return true
      }
    }

    return false
  }

  if (parent) {
    let destroy = parent.destroy
    parent.destroy = function () {
      self.destroy()
      destroy.call(this)
    }

    parent.singleton(id, () => {
      let scope = null
      return {
        depend (instance) {
          if (!scope) {
            scope =  parent._registry(LOCK)[id].instances.get(this).scope
          }
          scope.push(instance)
        },
        undepend (instance) {
          if (!scope) return
          let k = scope.indexOf(instance)
          if (k >= 0) scope.splice(k, 1)
        }
      }
    })
  }

  return self = {
    _registry (lock) {
      if (lock === LOCK) return registry
      throw new Error('The _registry() method is private.')
    },

    resolve (...names) {
      if (destroyed) throw new Error(ErrorMessages.DESTROYED)

      let resolved = []

      for (let name of names) {
        let entry = registry[name]
        let instance = null

        if (entry) {
          instance = entry.create()
        } else if (parent) {
          instance = parent.resolve(name)
          parent.resolve(id).depend(instance)
        }

        if (instance === null || instance === undefined) {
          throw new Error('Service not found "' + name + '"')
        }

        addToCurrentScope(instance)
        resolved.push(instance)
      }

      return resolved.length === 1 ? resolved[0] : resolved
    },

    release (...instances) {
      if (!registry) throw new Error(ErrorMessages.DESTROYED)

      let released = false

      for (let instance of instances) {
        if (instance) {
          let serviceEntry = lookupServiceEntryByInstance(instance)

          if (serviceEntry) {
            if (destroyed ||
                (serviceEntry.type !== LifecycleType.singleton &&
                !isInstanceDependedOn(instance))) {

              serviceEntry.release(instance)
              released = true
            }
          } else if (parent) {
            parent.resolve(id).undepend(instance)
            released = parent.release(instance) || released
          }
        }
      }

      return released
    },

    beginScope () {
      if (destroyed) throw new Error(ErrorMessages.DESTROYED)
      scopes.push([])
    },

    endScope () {
      if (destroyed) throw new Error(ErrorMessages.DESTROYED)

      let scope = scopes.pop()
      if (scope) {
        while (scope.length) {
          this.release(scope.pop())
        }
      }
    },

    destroy () {
      if (destroyed) throw new Error(ErrorMessages.DESTROYED)

      destroyed = true
      for (let key in registry) {
        registry[key].releaseAll()
      }

      scopes = null
      registry = null
    },

    addLifecycleConcerns(name, concerns) {
      if (destroyed) throw new Error(ErrorMessages.DESTROYED)

      let serviceEntry = registry[name]
      if (serviceEntry) serviceEntry.addLifecycleConcerns(concerns)
    },

    instance (name, instance, {concerns} = {concerns: {}}) {
      if (destroyed) throw new Error(ErrorMessages.DESTROYED)

      let type = LifecycleType.singleton
      let ioc = this
      let created = false

      registry[name] = createServiceEntry(ioc, name, type, () => instance)
      registry[name].addLifecycleConcerns(concerns)

      return instance
    },

    singleton (name, factory, {deps, isClass, concerns} = {deps: [], isClass: false, concerns: {}}) {
      if (destroyed) throw new Error(ErrorMessages.DESTROYED)
      if (typeof factory !== 'function') {
        throw new Error('Singleton factory must be a function.')
      }

      let type = LifecycleType.singleton
      let instance = null
      let ioc = this

      deps = deps || []

      registry[name] = createServiceEntry(ioc, name, type, (scope) => {
        if (instance === null) {
          let args = ioc.resolve(...deps)
          if (deps.length === 1) args = [args]
          scope.push(...args)
          instance = isClass ? variadicNew(factory, args) : factory(...args)
        }

        return instance
      })

      if (concerns) {
        registry[name].addLifecycleConcerns(concerns)
      }

      return factory
    },

    transient (name, factory, {deps, isClass, concerns} = {deps: [], isClass: false, concerns: {}}) {
      if (destroyed) throw new Error(ErrorMessages.DESTROYED)
      if (typeof factory !== 'function') {
        throw new Error('Transient factory must be a function.')
      }

      let type = LifecycleType.transient
      let ioc = this

      deps = deps || []

      registry[name] = createServiceEntry(ioc, name, type, (scope) => {
        let args = ioc.resolve(...deps)
        if (deps.length === 1) args = [args]
        scope.push(...args)
        return isClass ? variadicNew(factory, args) : factory(...args)
      })

      if (concerns) {
        registry[name].addLifecycleConcerns(concerns)
      }

      return factory
    }
  }
}
