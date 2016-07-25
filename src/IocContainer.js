import ServiceEntry from './lib/ServiceEntry'
import IocContainerGroupMixin from './lib/IocContainerGroupMixin'

const LifetimeType = {
  instance: 'instance',
  singleton: 'singleton',
  transient: 'transient'
}
const ErrorMessages = {
  DESTROYED: 'Ioc container has been destroyed. No method invocations are permitted.'
}

export const IocContainer = IocContainerGroupMixin(class {
  constructor () {
    this._registry = {} // key: serviceName, value: ServiceEntry
    this._scopes = [] // array of array of service instances
    this._destroyed = false
  }

  canResolve (serviceName) {
    if (this._destroyed) throw new Error(ErrorMessages.DESTROYED)
    return serviceName in this._registry
  }

  resolve (...serviceNames) {
    if (this._destroyed) throw new Error(ErrorMessages.DESTROYED)

    let resolved = []

    for (let serviceName of serviceNames) {
      let entry = this._registry[serviceName]
      let instance = null

      if (entry) {
        instance = entry.create()
      }

      if (instance === null || instance === undefined) {
        throw new Error('Service not found "' + serviceName + '"')
      }

      this._addToCurrentScope(instance)
      resolved.push(instance)
    }

    return resolved.length === 1 ? resolved[0] : resolved
  }

  tryResolve (...serviceNames) {
    try {
      return this.resolve(...serviceNames)
    } catch (_) {
      return null
    }
  }

  release (...instances) {
    if (!this._registry) throw new Error(ErrorMessages.DESTROYED)

    let released = false

    for (let instance of instances) {
      if (instance) {
        let serviceEntry = this._lookupServiceEntryByInstance(instance)

        if (serviceEntry) {
          if (this._destroyed ||
              (serviceEntry.type === LifetimeType.transient &&
              !this._isInstanceDependedOn(instance))) {
            serviceEntry.release(instance)
            released = true
          }
        }
      }
    }

    return released
  }

  beginScope () {
    if (this._destroyed) throw new Error(ErrorMessages.DESTROYED)
    this._scopes.push([])
  }

  endScope () {
    if (this._destroyed) throw new Error(ErrorMessages.DESTROYED)

    let scope = this._scopes.pop()
    if (scope) {
      while (scope.length) {
        this.release(scope.pop())
      }
    }
  }

  destroy () {
    if (this._destroyed) throw new Error(ErrorMessages.DESTROYED)

    this._destroyed = true
    for (let serviceName in this._registry) {
      this._registry[serviceName].destroy()
    }

    this._scopes = null
    this._registry = null
  }

  addLifecycleConcerns (serviceName, concerns) {
    if (this._destroyed) throw new Error(ErrorMessages.DESTROYED)

    let serviceEntry = this._registry[serviceName]
    if (serviceEntry) {
      serviceEntry.addLifecycleConcerns(concerns)
    } else {
      throw new Error('Service not found "' + serviceName + '"')
    }
  }

  instance (serviceName, instance, {concerns} = {concerns: {}}) {
    if (this._destroyed) throw new Error(ErrorMessages.DESTROYED)
    if (instance === null || instance === undefined) throw new Error('Service instance must be defined.')

    let type = LifetimeType.instance
    let ioc = this

    var entry = this._registry[serviceName]
    if (entry instanceof ServiceEntry) {
      entry.destroy()
    }

    this._registry[serviceName] = new ServiceEntry(ioc, serviceName, type, () => instance)
    this._registry[serviceName].addLifecycleConcerns(concerns)

    return instance
  }

  singleton (serviceName, factory, {deps, isClass, concerns} = {deps: [], isClass: false, concerns: {}}) {
    if (this._destroyed) throw new Error(ErrorMessages.DESTROYED)
    if (typeof factory !== 'function') {
      throw new Error('Singleton service factory must be a function.')
    }

    let type = LifetimeType.singleton
    let instance = null
    let ioc = this

    deps = deps || []

    var entry = this._registry[serviceName]
    if (entry instanceof ServiceEntry) {
      entry.destroy()
    }

    this._registry[serviceName] = new ServiceEntry(ioc, serviceName, type, (scope) => {
      if (instance === null) {
        let args = ioc.resolve(...deps)
        if (deps.length === 1) args = [args]
        scope.push(...args)
        /* eslint new-cap: 0 */
        instance = isClass ? new (factory.bind(factory, ...args)) : factory(...args)
      }

      return instance
    })

    if (concerns) {
      this._registry[serviceName].addLifecycleConcerns(concerns)
    }
  }

  transient (serviceName, factory, {deps, isClass, concerns} = {deps: [], isClass: false, concerns: {}}) {
    if (this._destroyed) throw new Error(ErrorMessages.DESTROYED)
    if (typeof factory !== 'function') {
      throw new Error('Transient service factory must be a function.')
    }

    let type = LifetimeType.transient
    let ioc = this

    deps = deps || []

    var entry = this._registry[serviceName]
    if (entry instanceof ServiceEntry) {
      entry.destroy()
    }

    this._registry[serviceName] = new ServiceEntry(ioc, serviceName, type, (scope) => {
      let args = ioc.resolve(...deps)
      if (deps.length === 1) args = [args]
      scope.push(...args)
      /* eslint new-cap: 0 */
      return isClass ? new (factory.bind(factory, ...args)) : factory(...args)
    })

    if (concerns) {
      this._registry[serviceName].addLifecycleConcerns(concerns)
    }
  }

  defaultInstance (serviceName, instance, {concerns} = {concerns: {}}) {
    return this.tryResolve(serviceName) || this.instance(serviceName, instance, { concerns: concerns })
  }

  _isInstanceDependedOn (instance) {
    for (let serviceName in this._registry) {
      let entry = this._registry[serviceName]

      for (let instEntry of entry.instances.values()) {
        if (instEntry.scope.indexOf(instance) >= 0) return true
      }
    }

    return false
  }

  _addToCurrentScope (instance) {
    if (this._scopes.length) this._scopes[this._scopes.length - 1].push(instance)
  }

  _lookupServiceEntryByInstance (instance) {
    for (let serviceName in this._registry) {
      if (this._registry[serviceName].instances.contains(instance)) return this._registry[serviceName]
    }
  }
})

export default new IocContainer()
