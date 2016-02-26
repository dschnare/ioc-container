Tinytest.add('createIocContainer -- should throw error after being destroyed when any method is invocted', (test) => {
  let ioc = createIocContainer()
  ioc.destroy()
  test.throws(() => ioc.release(instance))
  test.throws(() => ioc.destroy())
  test.throws(() => ioc.beginScope())
  test.throws(() => ioc.endScope())
  test.throws(() => ioc.addLifecycleConcerns('myInstance', {}))
  test.throws(() => ioc.instance('n', instance))
  test.throws(() => ioc.singleton('n', instance))
  test.throws(() => ioc.transient('n', instance))
})

Tinytest.add('createIocContainer -- should throw when resolving nonexistant service', (test) => {
  let ioc = createIocContainer()
  test.throws(() => ioc.resolve('nothing'))
})

Tinytest.add('createIocContainer -- should resolve multiple services at once', (test) => {
  let ioc = createIocContainer()
  ioc.instance('one', 1)
  ioc.singleton('two', () => 2)
  ioc.singleton('three', () => 3)
  test.equal(ioc.resolve('one', 'two', 'three').join(','), '1,2,3')
})

Tinytest.add('createIocContainer -- should release multiple services at once', (test) => {
  let ioc = createIocContainer()

  ioc.transient('one', () => {
    return {
      destroy () { this.destroyed = true }
    }
  })
  ioc.transient('two', () => {
    return {
      destroy () { this.destroyed = true }
    }
  })
  ioc.transient('three', () => {
    return {
      destroy () { this.destroyed = true }
    }
  })

  let instances = ioc.resolve('one', 'two', 'three')
  let other = ioc.resolve('one', 'two', 'three')
  ioc.release(...instances)

  test.isTrue(instances[0].destroyed, 'expected first instance to be destroyed')
  test.isTrue(instances[1].destroyed, 'expected second instance to be destroyed')
  test.isTrue(instances[2].destroyed, 'expected third instance to be destroyed')

  test.isFalse(other[0].destroyed, 'expected first other instance to not be destroyed')
  test.isFalse(other[1].destroyed, 'expected second othe rinstance to not be destroyed')
  test.isFalse(other[2].destroyed, 'expected third other instance to not be destroyed')
})

Tinytest.add('createIocContainer -- should register, resolve and release instance services', (test) => {
  let ioc = createIocContainer()
  let resolvedInstance = null
  let instance = {
    destroy () { this.destroyed = true }
  }

  ioc.instance('myInstance', instance)

  resolvedInstance = ioc.resolve('myInstance')
  test.isTrue(instance === resolvedInstance, 'expect instance to be resolved')

  resolvedInstance = ioc.resolve('myInstance')
  test.isTrue(instance === resolvedInstance, 'expect instance to be resolved')

  ioc.release(instance)
  test.isFalse(instance.destroyed, 'expect instance to not be destroyed')
  test.isTrue(instance === ioc.resolve('myInstance'), 'expect instance to be resolved')

  ioc.destroy()
  test.isTrue(instance.destroyed, 'expect instance to be destroyed')
  test.throws(() => ioc.resolve('myInstance'))
})

Tinytest.add('createIocContainer -- should register, resolve and release singleton services', (test) => {
  let ioc = createIocContainer()
  let callCount = 0

  test.throws(() => ioc.singleton('mySingleton', {}))
  ioc.singleton('mySingleton', () => {
    callCount += 1
    return {
      destroy () { this.destroyed = true }
    }
  })

  let instances = ioc.resolve('mySingleton', 'mySingleton')
  test.isTrue(instances[0] === instances[1], 'expect singleton instances to be the same')
  test.equal(callCount, 1, 'expect singleton class to be called once')

  ioc.resolve('mySingleton', 'mySingleton')
  test.equal(callCount, 1, 'expect singleton class to be called once')

  ioc.release(...instances)
  test.isFalse(instances[0].destroyed, 'expect singleton instance to not be destroyed')
  test.isFalse(instances[1].destroyed, 'expect singleton instance to not be destroyed')
  test.isTrue(instances[0] === ioc.resolve('mySingleton'), 'expect singleton to still resolve to same instance')

  ioc.destroy()
  test.isTrue(instances[0].destroyed, 'expect singleton instance to be destroyed')
})

Tinytest.add('createIocContainer -- should register, resolve and release singleton services (class)', (test) => {
  let ioc = createIocContainer()

  test.throws(() => ioc.singleton('mySingleton', {}))
  ioc.singleton('mySingleton', class {
    static callCount (incr = 0) {
      if (!this._callCount) this._callCount = 0
      return this._callCount += incr
    }
    constructor () {
      this.constructor.callCount(1)
    }
    destroy () {
      this.destroyed = true
    }
  }, { isClass: true })

  let instances = ioc.resolve('mySingleton', 'mySingleton')
  test.isTrue(instances[0] === instances[1], 'expect singleton instances to be the same')
  test.equal(instances[0].constructor.callCount(), 1, 'expect singleton class to be called once')

  ioc.resolve('mySingleton', 'mySingleton')
  test.equal(instances[0].constructor.callCount(), 1, 'expect singleton class to be called once')

  ioc.release(...instances)
  test.isFalse(instances[0].destroyed, 'expect singleton instance to not be destroyed')
  test.isFalse(instances[1].destroyed, 'expect singleton instance to not be destroyed')
  test.isTrue(instances[0] === ioc.resolve('mySingleton'), 'expect singleton to still resolve to same instance')

  ioc.destroy()
  test.isTrue(instances[0].destroyed, 'expect singleton instance to be destroyed')
})

Tinytest.add('createIocContainer -- should register, resolve and release transient services', (test) => {
  let ioc = createIocContainer()
  let callCount = 0

  test.throws(() => ioc.transient('myTransient', {}))

  ioc.transient('one', () => {
    callCount += 1
    return {
      name: 'one',
      destroy () { this.destroyed = true }
    }
  })

  let instance = ioc.resolve('one')
  let others = ioc.resolve('one', 'one')

  test.equal(callCount, 3, 'expect transient factory to be called three times')

  ioc.release(instance)
  test.isTrue(instance.destroyed, 'expect transient to be destroyed')
  test.isFalse(others[0].destroyed, 'expect first other transient not be destroyed')
  test.isFalse(others[1].destroyed, 'expect second other transient not be destroyed')

  ioc.release(...others)
  test.isTrue(others[0].destroyed, 'expect first other transient to be destroyed')
  test.isTrue(others[1].destroyed, 'expect second other transient to be destroyed')
})

Tinytest.add('createIocContainer -- should register, resolve and release transient services (class)', (test) => {
  let ioc = createIocContainer()

  test.throws(() => ioc.transient('myTransient', {}))

  ioc.transient('one', class {
    static callCount (incr = 0) {
      if (!this._callCount) this._callCount = 0
      return this._callCount += incr
    }
    constructor () {
      this.constructor.callCount(1)
      this.name = 'one'
    }
    destroy () { this.destroyed = true }
  }, { isClass: true })

  let instance = ioc.resolve('one')
  let others = ioc.resolve('one', 'one')

  test.equal(instance.constructor.callCount(), 3, 'expect transient class to be called three times')

  ioc.release(instance)
  test.isFalse(instance === others[0], 'expect a new transient to be created each time')
  test.isTrue(instance.destroyed, 'expect transient to be destroyed')
  test.isFalse(others[0].destroyed, 'expect first other transient not be destroyed')
  test.isFalse(others[1].destroyed, 'expect second other transient not be destroyed')

  ioc.release(...others)
  test.isTrue(others[0].destroyed, 'expect first other transient to be destroyed')
  test.isTrue(others[1].destroyed, 'expect second other transient to be destroyed')
})

Tinytest.add('createIocContainer -- should release a service\'s dependencies when service is released', (test) => {
  let ioc = createIocContainer()

  ioc.instance('config', { port: 5005 })
  ioc.singleton('context', () => {
    return {
      touchManager: {
        destroyed: false,
        touched: false
      },
      reset () {
        this.touchManager.destroyed = false
        this.touchManager.touched = false
      }
    }
  })
  ioc.singleton('ViewManager', (context) => {
    return {
      destroy () {
        this.destroyed = true
      }
    }
  }, { deps: [ 'context' ] })
  ioc.transient('TouchManager', (context) => {
    test.isNotUndefined(context, 'expect context to be passed in to TouchManager')
    return {
      touch () {
        context.touchManager.touched = true
      },
      destroy () {
        context.touchManager.destroyed = true
      }
    }
  }, { deps: [ 'context' ] })
  ioc.transient('view:home', (config, vm, tm) => {
    test.equal(config.port, 5005, 'expect config.port to be 5005')
    return {
      name: 'home',
      render () {
        return `<div>${config.port}</div>`
      },
      touch () {
        tm.touch()
      },
      destroy () {
        this.destroyed = true
      }
    }
  }, { deps: [ 'config', 'ViewManager', 'TouchManager' ]})

  let home = ioc.resolve('view:home')
  let vm = ioc.resolve('ViewManager')
  let context = ioc.resolve('context')

  test.equal(home.render(), '<div>5005</div>', 'expect home view to render the port number')
  test.isFalse(context.touchManager.touched)
  test.isFalse(context.touchManager.destroyed)

  home.touch()
  test.isTrue(context.touchManager.touched)

  ioc.release(home)
  test.isTrue(home.destroyed, 'expect home to be destroyed')
  test.isTrue(context.touchManager.destroyed, 'expect touch manager to be destroyed when home view is released')
  test.isFalse(vm.destroyed, 'expect view manager to not be destroyed when home view is released')

  context.reset()
  home = ioc.resolve('view:home')
  ioc.destroy()
  test.isTrue(context.touchManager.destroyed, 'expect touch manager to be destroyed when home view is released')
  test.isTrue(vm.destroyed, 'expect view manager to be destroyed')
})

Tinytest.add('createIocContainer -- should release all scoped service instances when scope is ended', (test) => {
  let ioc = createIocContainer()

  ioc.transient('one', () => {
    return {
      name: 'one',
      destroy () {
        this.destroyed = true
      }
    }
  })
  ioc.transient('two', () => {
    return {
      name: 'two',
      destroy () {
        this.destroyed = true
      }
    }
  })
  ioc.transient('three', () => {
    return {
      name: 'three',
      destroy () {
        this.destroyed = true
      }
    }
  })

  ioc.beginScope()

  let instances = ioc.resolve('one', 'two', 'three')

  ioc.endScope()

  for (let instance of instances) {
    test.isTrue(instance.destroyed, 'expect scoped instance to be destroyed after scope ends')
  }
})

Tinytest.add('createIocContainer -- should resolve, and release services from a parent container', (test) => {
  let ioc = createIocContainer()
  let childIoc = createIocContainer(ioc)

  ioc.transient('one', () => {
    return {
      name: 'one',
      destroy () {
        this.destroyed = true
      }
    }
  })

  childIoc.transient('two', () => {
    return {
      name: 'two',
      destroy () {
        this.destroyed = true
      }
    }
  })
  childIoc.transient('three', () => {
    return {
      name: 'three',
      destroy () {
        this.destroyed = true
      }
    }
  })

  ioc.beginScope()
  let instances = childIoc.resolve('one', 'two', 'three')
  ioc.endScope()

  test.equal(instances.length, 3, 'expect three services resolved')
  for (let instance of instances) {
    test.isFalse(instance.destroyed, 'expect scoped instance not to be destroyed after parent scope ends')
  }

  ioc.destroy()

  for (let instance of instances) {
    test.isTrue(instance.destroyed, 'expect scoped instance to be destroyed after parent is destroyed')
  }

  test.throws(() => childIoc.detroy())
})