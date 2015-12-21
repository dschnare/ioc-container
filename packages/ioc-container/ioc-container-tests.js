/*global Tinytest*/
Tinytest.add('ioc container injection and release', function (test) {
  class T {
    constructor(a, b, c) {
      this.a = a;
      this.b = b;
      this.c = c;
      this.$port = null;
    }

    initialize() {
      this.isInitialized = true;
    }

    destroy() {
      this.isDestroyed = true;
    }
  }

  let ioc = new IocContainer();
  ioc.config.set('port', '3000');
  ioc.install('a', { name: 'a', destroy: () => test.fail() });
  ioc.install('b', {
    name: 'b',
    initialize() {
      this.isInitialized = true;
    },
    destroy() {
      this.isDestroyed = true;
    }
  }, { transient: true });
  ioc.install('c', class {
    constructor(a) {
      this.name = 'c';
      this.a = a;
    }

    initialize() {
      this.isInitialized = true;
    }

    destroy() {
      this.isDestroyed = true;
    }
  }, { transient: true, newable: true });

  ioc.install('t', T, { transient: true, newable: true });
  let t = ioc.resolve('t');

  test.equal(t.a.name, 'a', 'Expected t#a to have a name equal to "a"');
  test.equal(t.b.name, 'b', 'Expected t#b to have a name equal to "b"');
  test.equal(t.c.name, 'c', 'Expected t#c to have a name equal to "c"');
  test.isTrue(t.c.a === t.a, 'Expected t#c#a to be the same object as t#a');
  test.equal(t.$port, '3000', 'Expected t#$port to be "3000"');

  test.isTrue(t.isInitialized, 'Expected to t#initialize to be called');
  test.isFalse(t.a.isInitialized, 'Expected to t#a#initialize to be called');
  test.isTrue(t.b.isInitialized, 'Expected to t#b#initialize to be called');
  test.isTrue(t.c.isInitialized, 'Expected to t#c#initialize to be called');

  let deps = ioc._models.t.instances[0].deps;
  test.equal(deps.length, 3, 'Expected to to have three deps');
  test.equal(deps[0].value.name, 'a', 'Expected first dep of t to be a');
  test.equal(deps[1].value.name, 'b', 'Expected second dep of t to be b');
  test.equal(deps[2].value.name, 'c', 'Expected third dep of t to be c');

  test.equal(deps[2].deps.length, 1);
  test.equal(deps[2].deps[0].value.name, 'a', 'Expected first dep of c to be a');

  ioc.release(t);
  test.equal(ioc._models.t.instances.length, 0, 'Expected to have no t instances left in IOC container');
  test.equal(ioc._models.a.instances.length, 1, 'Expected to have one a instances left in IOC container');
  test.equal(ioc._models.b.instances.length, 0, 'Expected to have no b instances left in IOC container');
  test.equal(ioc._models.c.instances.length, 0, 'Expected to have no c instances left in IOC container');

  test.isTrue(t.isDestroyed, 'Expected to t#destroy to be called');
  test.isFalse(t.a.isDestroyed, 'Expected to t#a#destroy to be called');
  test.isTrue(t.b.isDestroyed, 'Expected to t#b#destroy to be called');
  test.isTrue(t.c.isDestroyed, 'Expected to t#c#destroy to be called');
});

Tinytest.add('ioc parent container injection', function (test) {
  class T {
    constructor(a, b) {
      this.a = a;
      this.b = b;
    }
  }

  let ioc = new IocContainer();
  ioc.install('a', { name: 'a' });

  let childIoc = new IocContainer(ioc);
  childIoc.install('b', { name: 'b' });

  childIoc.install('t', T, { newable: true });

  let t = childIoc.resolve('t');
  test.isTrue(t instanceof T, 'Expected t to be an instance of T');
  test.equal(t.a.name, 'a', 'Expected t#a to have a name property equal to "a"');
  test.equal(t.b.name, 'b', 'Expected t#b to have a name property equal to "b"');

  test.equal(childIoc._parentContainerInstances.length, 0, 'Expected no parent container instances to exist');
  let deps = childIoc._models.t.instances[0].deps;
  test.equal(deps.length, 2, 'Expected t to have 2 deps');
  test.equal(deps[0].value.name, 'a', 'Expected first dep of t to be a');
  test.equal(deps[1].value.name, 'b', 'Expected second dep of t to be b');

  test.equal(ioc._models.a.instances.length, 1, 'Expected first IOC container to have one instance of a');

  // Simulate ioc.dispose() call:

  // release singletons first
  childIoc._release(null, { transient: false });
  // release left over transients last
  childIoc._release(null, { transient: true });

  test.equal(ioc._models.a.instances.length, 1, 'Expected first IOC container to have one instance of a');

  // release singletons first
  ioc._release(null, { transient: false });
  // release left over transients last
  ioc._release(null, { transient: true });

  test.equal(childIoc._models.t.instances.length, 0, 'Expected child IOC container to have no instances of t');
  test.equal(childIoc._models.b.instances.length, 0, 'Expected child IOC container to have no instances of b');
  test.equal(ioc._models.a.instances.length, 0, 'Expected first IOC container to have no instances of a');

  ioc.dispose();

  test.isUndefined(childIoc._models.t, 'Expected child IOC container to not have t installed');
  test.isUndefined(childIoc._models.b, 'Expected child IOC container to not have b installed');
  test.isNull(childIoc._parentContainer, 'Expected parent container to be null');
  test.isUndefined(ioc._models.a, 'Expected first IOC container to not have a installed');
});
