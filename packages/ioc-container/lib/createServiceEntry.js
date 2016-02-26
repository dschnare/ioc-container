let toString = Object.prototype.toString
/*
Internal function that creats a service entry.

@arg type The service type
@arg factory The factory function that returns {instance, created}
@return A service entry object {type, instances, release, factory}
*/
createServiceEntry = function (ioc, name, type, factory) {
  return {
    name: name,
    type: type,
    instances: createMap(),
    concerns: {
      initializing: [],
      create: [],
      destroying: []
    },

    release (instance) {
      var instEntry = this.instances.get(instance)
      if (instEntry) {
        let scope = instEntry.scope
        this.instances.remove(instance)

        for (let concern of this.concerns.destroying) {
          concern(instance, this)
        }

        if (typeof instance.destroy === 'function') {
          instance.destroy()
        }

        if (scope) {
          while (scope.length) {
            ioc.release(scope.pop())
          }
        }
      }
    },

    releaseAll () {
      for (let instance of this.instances.keys()) {
        this.release(instance)
      }
    },

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
    },

    create () {
      let scope = []
      let instance = factory(scope)

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
  }
}
