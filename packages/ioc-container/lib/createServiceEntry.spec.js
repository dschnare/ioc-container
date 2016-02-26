Tinytest.add('createServiceEntry -- should call initailize() on instance when new instance is created', (test) => {
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
  let entry = createServiceEntry(ioc, name, type, factory)
  let createdInstance = entry.create()

  test.equal(entry.name, 'serviceName', 'expect service entry name to be "serviceName"')
  test.equal(entry.type, 'factory', 'expect service entry type to be "factory"')
  test.isTrue(createdInstance === instance, 'expect created instance to equal our instance')
  test.isTrue(factory.called, 'expect factory to be called')
  test.isTrue(Array.isArray(factory.calledWith), 'expect factory to be passed an array')
  test.isTrue(instance.initializeCalled, 'expect initialize method to be called')
  test.isTrue(entry.instances.contains(instance), 'expect the instance to be saved')
})

Tinytest.add('createServiceEntry -- should release an instance created by the entry', (test) => {
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
  let entry = createServiceEntry(ioc, name, type, factory)
  let instance = entry.create()

  entry.release(null)
  test.isFalse(instance.destroyCalled, 'expect instance.destroy() not to be called')

  entry.release({})
  test.isFalse(instance.destroyCalled, 'expect instance.destroy() not to be called')

  entry.release(instance)
  test.isTrue(instance.destroyCalled, 'expect instance.destroy() not to be called')
  test.isFalse(entry.instances.contains(instance), 'expect instance to be removed from instances map')
})


Tinytest.add('createServiceEntry -- should call lifecycle concerns for factory service types', (test) => {
  let ioc = { release: () => {} }
  let name = 'serviceName'
  let type = 'factory'
  let concerns = {
    initializing: () => concerns.initializingCalled = true,

    create: [
      () => concerns.createCalled = true
    ],

    destroying: [
      () => concerns.destroyingCalled = true
    ]
  }
  let factory = () => {
    return {}
  }
  let entry = createServiceEntry(ioc, name, type, factory)
  entry.addLifecycleConcerns(concerns)
  let instance = entry.create()

  test.isTrue(concerns.initializingCalled, 'expect initializing lifecycle concern to be called')
  test.isTrue(concerns.createCalled, 'expect create lifecycle concern to be called')

  entry.release(instance)
  test.isTrue(concerns.destroyingCalled, 'expect destroying lifecycle concern to be called')

  concerns.destroyingCalled = false
  entry.release(instance)
  test.isFalse(concerns.destroyingCalled, 'expect destroying lifecycle concern not to be called')
})

Tinytest.add('createServiceEntry -- should call lifecycle concerns once for singleton service types', (test) => {
  let ioc = { release: () => {} }
  let name = 'serviceName'
  let type = 'singleton'
  let instance = null
  let concerns = {
    initializing: [
      () => concerns.initializingCalled = true
    ],

    create:() => concerns.createCalled = true,

    destroying: [
      () => concerns.destroyingCalled = true
    ]
  }
  let factory = () => {
    instance = instance || {}
    return instance
  }
  let entry = createServiceEntry(ioc, name, type, factory)
  entry.addLifecycleConcerns(concerns)
  let createdInstance = entry.create()

  test.isTrue(concerns.initializingCalled, 'expect initializing lifecycle concern to be called')
  test.isTrue(concerns.createCalled, 'expect create lifecycle concern to be called')

  concerns.initializingCalled = false
  concerns.createCalled = false
  createdInstance = entry.create()
  test.isTrue(createdInstance === instance, 'expect the same instance to be returned')
  test.isFalse(concerns.initializingCalled, 'expect initializing lifecycle concern not to be called')
  test.isFalse(concerns.createCalled, 'expect create lifecycle concern not to be called')

  entry.release(instance)
  test.isTrue(concerns.destroyingCalled, 'expect destroying lifecycle concern to be called')
})

Tinytest.add('createServiceEntry -- should release all instances in scope passed to factory', (test) => {
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
  let entry = createServiceEntry(ioc, name, type, factory)
  let instance = entry.create()

  entry.release(instance)
  test.equal(ioc.released.length, 3, 'expect 3 dependencies to be released')
  test.isTrue(deps.indexOf(ioc.released[0]) >= 0)
  test.isTrue(deps.indexOf(ioc.released[1]) >= 0)
  test.isTrue(deps.indexOf(ioc.released[2]) >= 0)
})

Tinytest.add('createServiceEntry -- should release all instances created', (test) => {
  let ioc = { release () {} }
  let name = 'serviceName'
  let type = 'factory'
  let factory = () => {
    return {}
  }
  let entry = createServiceEntry(ioc, name, type, factory)

  entry.create()
  entry.create()
  entry.create()
  entry.create()

  test.equal(entry.instances.size(), 4, 'expect 4 instances to have been created and saved')
  entry.releaseAll()
  test.equal(entry.instances.size(), 0, 'expect all instances to have been released')
})
