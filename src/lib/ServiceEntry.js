import Map from './Map'

let toString = Object.prototype.toString

export default class ServiceEntry {
  constructor (ioc, name, type, factory) {
    this.ioc = ioc
    this.name = name
    this.type = type
    this.factory = factory
    this.instances = new Map()
    this.concerns = {
      initializing: [],
      create: [],
      destroying: []
    }
  }

  release (instance) {
    var entry = this.instances.get(instance)
    if (entry) {
      let scope = entry.scope
      this.instances.delete(instance)

      for (let concern of this.concerns.destroying) {
        concern(instance, this)
      }

      if (typeof instance.destroy === 'function') {
        instance.destroy()
      }

      if (scope) {
        while (scope.length) {
          this.ioc.release(scope.pop())
        }
      }
    }
  }

  releaseAll () {
    for (let instance of this.instances.keys()) {
      this.release(instance)
    }
  }

  addLifecycleConcerns (concerns) {
    for (let key in this.concerns) {
      let concern = concerns[key]
      if (!concern) continue

      if (toString.call(concern) === '[object Array]') {
        for (let c of concern) {
          if (typeof c === 'function') this.concerns[key].push(c)
        }
      } else if (typeof concern === 'function') {
        this.concerns[key].push(concern)
      }
    }
  }

  create () {
    let scope = []
    let instance = this.factory(scope)

    if (instance !== null &&
        instance !== undefined &&
        !this.instances.contains(instance)) {
      this.instances.set(instance, { scope: scope })

      for (let concern of this.concerns.initializing) {
        concern(instance, this)
      }

      if (typeof instance.initialize === 'function') {
        instance.initialize()
      }

      for (let concern of this.concerns.create) {
        concern(instance, this)
      }
    }

    return instance
  }

  destroy () {
    this.releaseAll()
    this.ioc = null
    this.concerns = {}
  }
}
