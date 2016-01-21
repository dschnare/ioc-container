/*global Tinytest*/
Tinytest.add('ioc container injection and release', function (test) {
  class T {
    constructor(a, b, c, thePort, theChild) {
      this.a = a;
      this.b = b;
      this.c = c;
      this.port = thePort;
      this.child = theChild;
    }

    initialize() {
      this.isInitialized = true;
    }

    destroy() {
      this.isDestroyed = true;
    }
  }

  let ioc = new IocContainer();
  ioc.config.setKeys({
    port: '3000',
    nested: { child: 45 }
  });
  ioc.factory('a', () => {
    return { name: 'a', destroy: () => test.fail() };
  });
  ioc.factory('aa', () => {
    return { name: 'aa', destroy: () => test.fail() };
  });
  ioc.factory('b', () => {
    return {
      name: 'b',
      initialize() {
        this.isInitialized = true;
      },
      destroy() {
        test.fail();
      }
    };
  }, { transient: true, initializable: true });
  ioc.service('c', class {
    static transient() { return false; }
    static inject() { return ['a', 'a']; }

    constructor(theA, theAA) {
      this.name = 'c';
      this.a = theA;
      this.aa = theAA;
    }

    initialize() {
      this.isInitialized = true;
    }
  }, { transient: true, initializable: true, inject: ['a', 'aa'] });

  ioc.service('t', T, {
    transient: true,
    inject: ['a', 'b', 'c', '$port', '$nested.child'],
    initializable: true,
    destroyable: true
  });

  let t = ioc.resolve('t');

  test.equal(t.a.name, 'a', 'Expected t#a to have a name equal to "a"');
  test.equal(t.b.name, 'b', 'Expected t#b to have a name equal to "b"');
  test.equal(t.c.name, 'c', 'Expected t#c to have a name equal to "c"');
  test.isTrue(t.c.a === t.a, 'Expected t#c#a to be the same object as t#a');
  test.equal(t.c.aa.name, 'aa', 'Expected t#c#a#name to be "aa"');
  test.equal(t.port, '3000', 'Expected t#port to be "3000"');
  test.equal(t.child, 45, 'Expected t#child to be 45');

  test.isTrue(t.isInitialized, 'Expected to t#initialize to be called');
  test.isFalse(t.a.isInitialized, 'Expected to t#a#initialize to be called');
  test.isTrue(t.b.isInitialized, 'Expected to t#b#initialize to be called');
  test.isTrue(t.c.isInitialized, 'Expected to t#c#initialize to be called');

  let deps = ioc._models.t.instances[0].deps;
  test.equal(deps.length, 3, 'Expected to to have three deps');
  test.equal(deps[0].value.name, 'a', 'Expected first dep of t to be a');
  test.equal(deps[1].value.name, 'b', 'Expected second dep of t to be b');
  test.equal(deps[2].value.name, 'c', 'Expected third dep of t to be c');

  test.equal(deps[2].deps.length, 2);
  test.equal(deps[2].deps[0].value.name, 'a', 'Expected first dep of c to be a');

  ioc.release(t);
  test.isNull(t.a, 'Expected t#a to be null');
  test.isNull(t.b, 'Expected t#b to be null');
  test.isNull(t.c, 'Expected t#c to be null');
  test.equal(ioc._models.t.instances.length, 0, 'Expected to have no t instances left in IOC container');
  test.equal(ioc._models.a.instances.length, 1, 'Expected to have one a instances left in IOC container');
  test.equal(ioc._models.b.instances.length, 0, 'Expected to have no b instances left in IOC container');
  test.equal(ioc._models.c.instances.length, 0, 'Expected to have no c instances left in IOC container');

  test.isTrue(t.isDestroyed, 'Expected to t#destroy to be called');
});

Tinytest.add('ioc parent container injection', function (test) {
  class T {
    constructor(a, b, array) {
      this.a = a;
      this.b = b;
      this.array = array;
    }
  }

  let ioc = new IocContainer();
  ioc.constant('a', { name: 'a' });
  ioc.constant('array', [1, 2, 3, 4]);

  let childIoc = new IocContainer(ioc);
  childIoc.constant('b', { name: 'b' });

  childIoc.service('t', T);

  test.isTrue(childIoc.canResolve('array'), 'Expected child IOC container to be able to resolve "array"');

  let t = childIoc.resolve('t');
  test.isTrue(t instanceof T, 'Expected t to be an instance of T');
  test.equal(t.a.name, 'a', 'Expected t#a to have a name property equal to "a"');
  test.equal(t.b.name, 'b', 'Expected t#b to have a name property equal to "b"');
  test.isTrue(t.array === ioc.resolve('array'), 'Expected t#array to be the array installed');

  test.equal(childIoc._parentContainerInstances.length, 0, 'Expected no parent container instances to exist');
  let deps = childIoc._models.t.instances[0].deps;
  test.equal(deps.length, 3, 'Expected t to have 3 deps');
  test.equal(deps[0].value.name, 'a', 'Expected first dep of t to be a');
  test.equal(deps[1].value.name, 'b', 'Expected second dep of t to be b');
  test.equal(deps[2].value.join(','), '1,2,3,4', 'Expected third dep of t to be array');

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
  test.isNull(childIoc.parentContainer, 'Expected parent container to be null');
  test.isUndefined(ioc._models.a, 'Expected first IOC container to not have a installed');
});
