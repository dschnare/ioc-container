import {test} from 'tape'
import ServiceEntry from './ServiceEntry'

test.test('ServiceEntry', function (t) {
  t.test('should call initailize() on instance when new instance is created', (t) => {
    let ioc = { release: () => {} }
    let name = 'serviceName'
    let type = 'factory'
    let instance = {
      initialize () {
        this.initializeCalled = true
      }
    }
    let factory = (scope) => {
      factory.called = true
      factory.calledWith = scope
      return instance
    }
    let entry = new ServiceEntry(ioc, name, type, factory)
    let createdInstance = entry.create()

    t.equal(entry.name, 'serviceName', 'expect service entry name to be "serviceName"')
    t.equal(entry.type, 'factory', 'expect service entry type to be "factory"')
    t.ok(createdInstance === instance, 'expect created instance to equal our instance')
    t.ok(factory.called, 'expect factory to be called')
    t.ok(Array.isArray(factory.calledWith), 'expect factory to be passed an array')
    t.ok(instance.initializeCalled, 'expect initialize method to be called')
    t.ok(entry.instances.contains(instance), 'expect the instance to be saved')

    t.end()
  })

  t.test('should release an instance created by the entry', (t) => {
    let ioc = { release: () => {} }
    let name = 'serviceName'
    let type = 'factory'
    let factory = () => {
      return {
        destroy () {
          this.destroyCalled = true
        }
      }
    }
    let entry = new ServiceEntry(ioc, name, type, factory)
    let instance = entry.create()

    entry.release(null)
    t.notOk(instance.destroyCalled, 'expect instance.destroy() not to be called')

    entry.release({})
    t.notOk(instance.destroyCalled, 'expect instance.destroy() not to be called')

    entry.release(instance)
    t.ok(instance.destroyCalled, 'expect instance.destroy() not to be called')
    t.notOk(entry.instances.contains(instance), 'expect instance to be removed from instances map')

    t.end()
  })

  t.test('should call lifecycle concerns for factory service types', (t) => {
    let ioc = { release: () => {} }
    let name = 'serviceName'
    let type = 'factory'
    let concerns = {
      initializing () { concerns.initializingCalled = true },

      create: [
        function () { concerns.createCalled = true }
      ],

      destroying: [
        function () { concerns.destroyingCalled = true }
      ]
    }
    let factory = () => {
      return {}
    }
    let entry = new ServiceEntry(ioc, name, type, factory)
    entry.addLifecycleConcerns(concerns)
    let instance = entry.create()

    t.ok(concerns.initializingCalled, 'expect initializing lifecycle concern to be called')
    t.ok(concerns.createCalled, 'expect create lifecycle concern to be called')

    entry.release(instance)
    t.ok(concerns.destroyingCalled, 'expect destroying lifecycle concern to be called')

    concerns.destroyingCalled = false
    entry.release(instance)
    t.notOk(concerns.destroyingCalled, 'expect destroying lifecycle concern not to be called')

    t.end()
  })

  t.test('should call lifecycle concerns once for singleton service types', (t) => {
    let ioc = { release: () => {} }
    let name = 'serviceName'
    let type = 'singleton'
    let instance = null
    let concerns = {
      initializing: [
        function () { concerns.initializingCalled = true }
      ],

      create () { concerns.createCalled = true },

      destroying: [
        function () { concerns.destroyingCalled = true }
      ]
    }
    let factory = () => {
      instance = instance || {}
      return instance
    }
    let entry = new ServiceEntry(ioc, name, type, factory)
    entry.addLifecycleConcerns(concerns)
    let createdInstance = entry.create()

    t.ok(concerns.initializingCalled, 'expect initializing lifecycle concern to be called')
    t.ok(concerns.createCalled, 'expect create lifecycle concern to be called')

    concerns.initializingCalled = false
    concerns.createCalled = false
    createdInstance = entry.create()
    t.ok(createdInstance === instance, 'expect the same instance to be returned')
    t.notOk(concerns.initializingCalled, 'expect initializing lifecycle concern not to be called')
    t.notOk(concerns.createCalled, 'expect create lifecycle concern not to be called')

    entry.release(instance)
    t.ok(concerns.destroyingCalled, 'expect destroying lifecycle concern to be called')

    t.end()
  })

  t.test('should release all instances in scope passed to factory', (t) => {
    let ioc = {
      released: [],
      release (inst) {
        this.released.push(inst)
      }
    }
    let name = 'serviceName'
    let type = 'factory'
    let deps = [{}, {}, {}]
    let factory = (scope) => {
      let instance = {}
      scope.push.apply(scope, deps)
      return instance
    }
    let entry = new ServiceEntry(ioc, name, type, factory)
    let instance = entry.create()

    entry.release(instance)
    t.equal(ioc.released.length, 3, 'expect 3 dependencies to be released')
    t.ok(deps.indexOf(ioc.released[0]) >= 0)
    t.ok(deps.indexOf(ioc.released[1]) >= 0)
    t.ok(deps.indexOf(ioc.released[2]) >= 0)

    t.end()
  })

  t.test('should release all instances created', (t) => {
    let ioc = { release () {} }
    let name = 'serviceName'
    let type = 'factory'
    let factory = () => {
      return {}
    }
    let entry = new ServiceEntry(ioc, name, type, factory)

    entry.create()
    entry.create()
    entry.create()
    entry.create()

    t.equal(entry.instances.size(), 4, 'expect 4 instances to have been created and saved')
    entry.releaseAll()
    t.equal(entry.instances.size(), 0, 'expect all instances to have been released')

    t.end()
  })

  t.end()
})
