import {test} from 'tape'
import {IocContainer} from './IocContainer'

test('IocContainer', function (t) {
  t.test('should throw error after being destroyed when any method is invocted', (t) => {
    let ioc = new IocContainer()
    let instance = null
    ioc.destroy()
    t.throws(() => ioc.release(instance))
    t.throws(() => ioc.destroy())
    t.throws(() => ioc.beginScope())
    t.throws(() => ioc.endScope())
    t.throws(() => ioc.addLifecycleConcerns('myInstance', {}))
    t.throws(() => ioc.instance('n', instance))
    t.throws(() => ioc.singleton('n', instance))
    t.throws(() => ioc.transient('n', instance))

    t.end()
  })

  t.test('should throw when resolving nonexistant service', (t) => {
    let ioc = new IocContainer()
    t.throws(() => ioc.resolve('nothing'))

    t.end()
  })

  t.test('should resolve multiple services at once', (t) => {
    let ioc = new IocContainer()
    ioc.instance('one', 1)
    ioc.singleton('two', () => 2)
    ioc.singleton('three', () => 3)
    t.equal(ioc.resolve('one', 'two', 'three').join(','), '1,2,3')

    t.end()
  })

  t.test('should release multiple services at once', (t) => {
    let ioc = new IocContainer()

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

    t.ok(instances[0].destroyed, 'expected first instance to be destroyed')
    t.ok(instances[1].destroyed, 'expected second instance to be destroyed')
    t.ok(instances[2].destroyed, 'expected third instance to be destroyed')

    t.notOk(other[0].destroyed, 'expected first other instance to not be destroyed')
    t.notOk(other[1].destroyed, 'expected second othe rinstance to not be destroyed')
    t.notOk(other[2].destroyed, 'expected third other instance to not be destroyed')

    t.end()
  })

  t.test('should register, resolve and release instance services', (t) => {
    let ioc = new IocContainer()
    let resolvedInstance = null
    let instance = {
      destroy () { this.destroyed = true }
    }

    ioc.instance('myInstance', instance)

    resolvedInstance = ioc.resolve('myInstance')
    t.ok(instance === resolvedInstance, 'expect instance to be resolved')

    resolvedInstance = ioc.resolve('myInstance')
    t.ok(instance === resolvedInstance, 'expect instance to be resolved')

    ioc.release(instance)
    t.notOk(instance.destroyed, 'expect instance to not be destroyed')
    t.ok(instance === ioc.resolve('myInstance'), 'expect instance to be resolved')

    ioc.destroy()
    t.ok(instance.destroyed, 'expect instance to be destroyed')
    t.throws(() => ioc.resolve('myInstance'))

    t.end()
  })

  t.test('should register, resolve and release singleton services', (t) => {
    let ioc = new IocContainer()
    let callCount = 0

    t.throws(() => ioc.singleton('mySingleton', {}))
    ioc.singleton('mySingleton', () => {
      callCount += 1
      return {
        destroy () { this.destroyed = true }
      }
    })

    let instances = ioc.resolve('mySingleton', 'mySingleton')
    t.ok(instances[0] === instances[1], 'expect singleton instances to be the same')
    t.equal(callCount, 1, 'expect singleton class to be called once')

    ioc.resolve('mySingleton', 'mySingleton')
    t.equal(callCount, 1, 'expect singleton class to be called once')

    ioc.release(...instances)
    t.notOk(instances[0].destroyed, 'expect singleton instance to not be destroyed')
    t.notOk(instances[1].destroyed, 'expect singleton instance to not be destroyed')
    t.ok(instances[0] === ioc.resolve('mySingleton'), 'expect singleton to still resolve to same instance')

    ioc.destroy()
    t.ok(instances[0].destroyed, 'expect singleton instance to be destroyed')

    t.end()
  })

  t.test('should register, resolve and release singleton services (class)', (t) => {
    let ioc = new IocContainer()

    t.throws(() => ioc.singleton('mySingleton', {}))
    ioc.singleton('mySingleton', class {
      static callCount (incr = 0) {
        if (!this._callCount) this._callCount = 0
        this._callCount += incr
        return this._callCount
      }
      constructor () {
        this.constructor.callCount(1)
      }
      destroy () {
        this.destroyed = true
      }
    }, { isClass: true })

    let instances = ioc.resolve('mySingleton', 'mySingleton')
    t.ok(instances[0] === instances[1], 'expect singleton instances to be the same')
    t.equal(instances[0].constructor.callCount(), 1, 'expect singleton class to be called once')

    ioc.resolve('mySingleton', 'mySingleton')
    t.equal(instances[0].constructor.callCount(), 1, 'expect singleton class to be called once')

    ioc.release(...instances)
    t.notOk(instances[0].destroyed, 'expect singleton instance to not be destroyed')
    t.notOk(instances[1].destroyed, 'expect singleton instance to not be destroyed')
    t.ok(instances[0] === ioc.resolve('mySingleton'), 'expect singleton to still resolve to same instance')

    ioc.destroy()
    t.ok(instances[0].destroyed, 'expect singleton instance to be destroyed')

    t.end()
  })

  t.test('should register, resolve and release transient services', (t) => {
    let ioc = new IocContainer()
    let callCount = 0

    t.throws(() => ioc.transient('myTransient', {}))

    ioc.transient('one', () => {
      callCount += 1
      return {
        name: 'one',
        destroy () { this.destroyed = true }
      }
    })

    let instance = ioc.resolve('one')
    let others = ioc.resolve('one', 'one')

    t.equal(callCount, 3, 'expect transient factory to be called three times')

    ioc.release(instance)
    t.ok(instance.destroyed, 'expect transient to be destroyed')
    t.notOk(others[0].destroyed, 'expect first other transient not be destroyed')
    t.notOk(others[1].destroyed, 'expect second other transient not be destroyed')

    ioc.release(...others)
    t.ok(others[0].destroyed, 'expect first other transient to be destroyed')
    t.ok(others[1].destroyed, 'expect second other transient to be destroyed')

    t.end()
  })

  t.test('should register, resolve and release transient services (class)', (t) => {
    let ioc = new IocContainer()

    t.throws(() => ioc.transient('myTransient', {}))

    ioc.transient('one', class {
      static callCount (incr = 0) {
        if (!this._callCount) this._callCount = 0
        this._callCount += incr
        return this._callCount
      }
      constructor () {
        this.constructor.callCount(1)
        this.name = 'one'
      }
      destroy () { this.destroyed = true }
    }, { isClass: true })

    let instance = ioc.resolve('one')
    let others = ioc.resolve('one', 'one')

    t.equal(instance.constructor.callCount(), 3, 'expect transient class to be called three times')

    ioc.release(instance)
    t.notOk(instance === others[0], 'expect a new transient to be created each time')
    t.ok(instance.destroyed, 'expect transient to be destroyed')
    t.notOk(others[0].destroyed, 'expect first other transient not be destroyed')
    t.notOk(others[1].destroyed, 'expect second other transient not be destroyed')

    ioc.release(...others)
    t.ok(others[0].destroyed, 'expect first other transient to be destroyed')
    t.ok(others[1].destroyed, 'expect second other transient to be destroyed')

    t.end()
  })

  t.test('should release a service\'s dependencies when service is released', (t) => {
    let ioc = new IocContainer()

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
      t.notEqual(context, undefined, 'expect context to be passed in to TouchManager')
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
      t.equal(config.port, 5005, 'expect config.port to be 5005')
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
    }, { deps: [ 'config', 'ViewManager', 'TouchManager' ] })

    let home = ioc.resolve('view:home')
    let vm = ioc.resolve('ViewManager')
    let context = ioc.resolve('context')

    t.equal(home.render(), '<div>5005</div>', 'expect home view to render the port number')
    t.notOk(context.touchManager.touched)
    t.notOk(context.touchManager.destroyed)

    home.touch()
    t.ok(context.touchManager.touched)

    ioc.release(home)
    t.ok(home.destroyed, 'expect home to be destroyed')
    t.ok(context.touchManager.destroyed, 'expect touch manager to be destroyed when home view is released')
    t.notOk(vm.destroyed, 'expect view manager to not be destroyed when home view is released')

    context.reset()
    home = ioc.resolve('view:home')
    ioc.destroy()
    t.ok(context.touchManager.destroyed, 'expect touch manager to be destroyed when home view is released')
    t.ok(vm.destroyed, 'expect view manager to be destroyed')

    t.end()
  })

  t.test('should release all scoped service instances when scope is ended', (t) => {
    let ioc = new IocContainer()

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
      t.ok(instance.destroyed, 'expect scoped instance to be destroyed after scope ends')
    }

    t.end()
  })

  t.test('should resolve, and release services from a parent container', (t) => {
    let ioc = new IocContainer()
    let childIoc = new IocContainer()
    ioc.addChild(childIoc)

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
    let instances = ioc.resolve('one', 'two', 'three')
    ioc.endScope()

    t.equal(instances.length, 3, 'expect three services resolved')
    t.equal(instances[0].name, 'one', 'expect first instance to be "one"')
    t.ok(instances[0].destroyed, 'expect first scoped instance to be destroyed after scope ends')
    t.equal(instances[1].name, 'two', 'expect second instance to be "two"')
    t.ok(instances[1].destroyed, 'expect second scoped instance to be destroyed after scope ends')
    t.equal(instances[2].name, 'three', 'expect third instance to be "three"')
    t.ok(instances[2].destroyed, 'expect third scoped instance to be destroyed after scope ends')

    instances = ioc.resolve('one', 'two', 'three')
    ioc.destroy()

    for (let instance of instances) {
      t.ok(instance.destroyed, 'expect scoped instance to be destroyed after parent is destroyed')
    }

    t.throws(() => childIoc.detroy())

    t.end()
  })

  t.end()
})
