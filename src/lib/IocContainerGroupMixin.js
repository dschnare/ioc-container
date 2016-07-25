export default function IocContainerGroupMixin (Cls) {
  return class IocContainer extends Cls {
    constructor () {
      super()
      this._children = []
    }

    addChild (ioc) {
      if (!(ioc instanceof IocContainer)) throw new Error('Child must be an instance of IocContainer.')
      if (ioc._parent === this) return ioc
      if (ioc._parent) ioc._parent.removeChild(ioc)
      ioc._parent = this
      this._children.push(ioc)
    }

    removeChild (ioc) {
      if (ioc._parent === this) {
        ioc._parent = null
        for (let i = 0, l = this._children.length; i < l; i++) {
          if (this._children[i] === ioc) {
            this._children.splice(i, 1)
            break
          }
        }
      }
    }

    canResolve (name) {
      let canResolve = super.canResolve(name)

      for (let child of this._children) {
        if (child.canResolve(name)) {
          return true
        }
      }

      return canResolve
    }

    resolve (...names) {
      let resolved = []

      for (let name of names) {
        if (super.canResolve(name)) {
          resolved.push(super.resolve(name))
        } else {
          let found = false
          for (let child of this._children) {
            if (child.canResolve(name)) {
              let instance = child.resolve(name)
              super._addToCurrentScope(instance)
              resolved.push(instance)
              found = true
              break
            }
          }
          if (!found) {
            throw new Error('Service not found "' + name + '"')
          }
        }
      }

      return resolved.length === 1 ? resolved[0] : resolved
    }

    release (...instances) {
      // Will throw for us if container is destroyed.
      if (!this._registry) return super.release()

      let released = false

      for (let instance of instances) {
        if (super._lookupServiceEntryByInstance(instance)) {
          released = super.release(instance)
        } else {
          for (let child of this._children) {
            if (child._lookupServiceEntryByInstance(instance)) {
              released = child.release(instance)
              break
            }
          }
        }
      }

      return released
    }

    addLifeCycleConcerns (name, concerns) {
      if (super.canResolve(name)) {
        super.addLifeCycleConcerns(name, concerns)
      } else {
        for (let child of this._children) {
          if (child.canResolve(name)) {
            child.addLifeCycleConcerns(name, concerns)
            break
          }
        }
      }
    }

    destroy () {
      super.destroy()
      while (this._children.length) {
        let child = this._children.pop()
        child.destroy()
        this.removeChild(child)
      }
    }
  }
}
