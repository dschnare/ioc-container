# Overview

A simple IOC container for Meteor.


# Quick Start

Create a new project

    meteor create ioc-proj
    cd ioc-proj

Now open `ioc-proj.js` and replace the contents of that file with this quick start.

    if (Meteor.isClient) {
      // A quick test
      class MyClass {
        static inject() { return ['myOtherClass', '$port']; }

        constructor(myOtherClass, $port) {
          this._myOtherClass = myOtherClass;
          this.port = $port;
        }
      }

      class MyOtherClass {
        static inject() { return ['$port']; }

        constructor($port) {
          this._port = $port;
        }
      }

      let myObj = {
        port: null,
        myOtherClass: null,
        myClass: null,
        initialize() {
          console.log('myObj#initialize()', this.port, this.myOtherClass, this.myClass);
        },
        destroy() {
          // do stuff to destroy myself like removing event listeners.
          // myOtherClass and myClass will automatically be nulled out for us.
          console.log('myObj#destroy()');
        }
      };

      Template.hello.onCreated(function () {
        let ioc = new IocContainer();
        ioc.config.set('port', 3000);

        ioc.service('myClass', MyClass);
        ioc.service('myOtherClass', MyOtherClass);

        ioc.factory('myObj', ($port, myClass, myOtherClass) => {
          let obj = Object.create(myObj);
          obj.port = $port;
          obj.myClass = myClass;
          obj.myOtherClass = myOtherClass;
          return obj;
        }, {
          inject: [ '$port', 'myClass', 'myOtherClass' ],
          transient: true,
          initializable: true,
          destroyable: true
        });

        let obj = ioc.resolve('myObj');

        // now I'm done with obj...
        ioc.release(obj);

        // or I can dispose the entire IOC container,
        // releasing all service instances along with it.
        ioc.dispose();
      });
    }


# Reference

## IocContainer()

    IocContainer(parentContainer)

Constructs a new intance of an IOC container with an optional parent IOC
conatiner. If a parent container is specified then `resolve()` will traverse
into the parent container if the resolution fails using this own container.


## IocContainer#service

    service(name, Ctor, { transient, concerns, inject, initializable, destroyable })

Installs a new service that can be resolved with the specified name. The
service has to be a constructor function.

All services are singletons, that is they are only created once and the same
instance is returned each time `resolve()` asks for them. If the `transient`
option is set then a new instance will be created each time `resolve()` asks
for them.

The opional `concerns` parameter is an object used to register lifecycle
concerns by calling `addLifecycleConcern()`. For information on adding
lifecycle concerns see the docs on this method.

The optional `inject` parameter is an array of dependency names that will be
injected into the service. The order of the dependency names is important,
since function arguments are injected in the order they appear. Without this
parameter, dependency names are inferred automatically by inspecting the formal
parameter names of the constructor. Any dependency name that starts with `$`
will have the value of the config key without the `$` prefix injected. This
parameter is useful if your code is obfuscated.

In addition to the `inject` parameter an `inject` array property or function on
the constructor (i.e. static) can be sepcified. However the `inject` parameter
will take precedence.

In addition to the `inject` parameter an `inject` array property or function on
the constructor (i.e. static) can be sepcified. However the `inject` parameter
will take precedence.

In addition to the `transient`, `initailizable` and `destroyable` parameters,
properties of the same name can be defined as either a function that returns a
truthy value or a property set to a truthy value on the constructor
(i.e. static). However the parameters will take precedence.

All services can optionally define `initialize` and `destroy` methods that will
be called if the `initializable` and `destroyable` parameters are set to
`true`. `initialize` will be called after the service has been constructed and
`destroy` will be called after the service has been released.

**Example:**

    ioc.service('myService', class {
      /* can define options as static properties, but will
      be overridden by parameters passed to service() method */
      static transient() { return true }

      constructor(a, b, port) {
        this.a = a;
        this.b = b;
        this.port = port;
      }

      initialize() {
        /* use this.a, this.b and this.port */
      }

      destroy() {
      }
    }, {
      /* '$' prefixed dependencies are config keys */
      inject: ['a', 'b', '$port'],
      initializable: true,
      destroyable: true
    })


## IocContainer#factory

    factory(name, fn, { transient, concerns, inject, initializable, destroyable })

Installs a new service that can be resolved with the specified name. The
service has to be a factory function.

All services are singletons, that is they are only created once and the same
instance is returned each time `resolve()` asks for them. If the `transient`
option is set then a new instance will be created each time `resolve()` asks
for them.

The opional `concerns` parameter is an object used to register lifecycle
concerns by calling `addLifecycleConcern()`. For information on adding
lifecycle concerns see the docs on this method.

The optional `inject` parameter is an array of dependency names that will be
injected into the service. The order of the dependency names is important,
since function arguments are injected in the order they appear. Without this
parameter, dependency names are inferred automatically by inspecting the formal
parameter names of the function. Any dependency name that starts with `$`
will have the value of the config key without the `$` prefix injected. This
parameter is useful if your code is obfuscated.

In addition to the `inject` parameter an `inject` array property or function on
the function (i.e. static) can be sepcified. However the `inject` parameter
will take precedence.

In addition to the `transient`, `initailizable` and `destroyable` parameters,
properties of the same name can be defined as either a function that returns a
truthy value or a property set to a truthy value on the function (i.e. static).
However the parameters will take precedence.

All services can optionally define `initialize` and `destroy` methods that will
be called if the `initializable` and `destroyable` parameters are set to
`true`. `initialize` will be called after the service has been constructed and
`destroy` will be called after the service has been released.

**Example:**

    ioc.factory('myService', function(a, b, port) {
      return {
        initialize() {
          /* use a, b and port */
        },

        destroy() {
        }
      };
    }, {
      /* '$' prefixed dependencies are config keys */
      inject: ['a', 'b', '$port'],
      /* not a singleton */
      transient: true,
      initializable: true,
      destroyable: true
    })

## IocContainer#constant

    constant(name, value)

Installs a new service that can be resolved with the specified name. The
service can be any value and it will be retrieved as-is. No dependencies will
be injected.

**Example:**

    ioc.constant('version', '1.0.1');
    ioc.constant('myValue', {
      numbers: [1, 2, 3, 4]
    });

    // Alternatively we can specify the dependencies we want to be
    // injected into MyClass when it's resolved. This would be necessary
    // if your code were to be obfuscated.
    ioc.install('myClass', MyClass, { newable: true, inject: ['a', '$port'] });
    // 'a' can have its properties injected as well in the same fashion.
    ioc.install('a', ($port) => {
      return { name: 'a', port: $port };
    }, { transient: true, inject: ['$port'] });

## IocContainer#resolve

    resolve(name)

Attempts to resolve the named service. If the name starts with `$` then the
config key without the `$` prefix will be looked up. If the resolution fails
then an error is thrown.

The special `$config` service returns a copy of the entire config object
containing all keys.

**Example:**

    ioc.config.set('port', 3000);
    ioc.resolve('$port') // 3000

    ioc.factory('a', function (port) {
      return { name: 'a', port: port };
    }, { inject: ['$port'] });
    ioc.resolve('a'); // { name: 'a', port: 3000 }

    ioc.resolve('$config'); // { all config keys }


## IocConatiner#canResolve

    canResolve(name)

Determines if the service name can be resolved without throwing an error. This
will delegate to the parent container if one is specified and the service name
cannot be resolved in this own container.


## IocContainer#release

    release(obj)

Attempts to release a transient instance managed by this IOC container and all its
dependencies. If the instance being released is a singleton then this method
does nothing. Only transient instances can be released using this method. To
release singleton instances the container must be disposed.

All properties that have been set to a managed instance will automatically be
set to null when the owning instance is released.

**Example:**

    ioc.service('a', class {
      constructor() {
        this.name: 'a';
        this.initCount: 0;
      }

      initialize() {
        this.initCount += 1;
      }
    }, { initializable: true }) // singleton
    ioc.factory('b', (a) => {
      return {
        name: 'b',
        a: a
      };
    }, { transient: true }); // transient

    let b = ioc.resolve('b'); // { name: 'b', a: { name: 'a', initCount: 1 } }
    let a = ioc.resolve('a');
    b.a === a // true
    ioc.release(b);
    b.a // null

    b = ioc.resolve('b'); // { name: 'b', a: { name: 'a', initCount: 1 } }
    b.a === a // true


## IocContainer#addLifecycleConcern

    addLifecycleConcern(nameOrPredicate, { initializing, create, destroy })

Adds a lifecycle concern that will be called during a lifecycle event either
for a particular service or any service that satisfies the predicate.

The `initializing` concern is called after a service has had its dependencies
injected but before its `initialize` method has been called. This concern
provides a mechanism to modify the instance or inspect the service's model.

The `create` concern is called after a service has been initialized and
provides a mechanism to modify the instance or inspect the service's model.

The `destroy` concern is called before a service is to be destroyed and
provides a mechinism to modify the instance or inspect the service's model.

The service `model` is an object with the following shape.

    {
      newable,
      transient,
      handler(),
      instances: [{ value, deps, name }],
      concerns?: [{ initializng, create, destroy }]
    }

**Example:**

    ioc.addLifecycleConcern('myClass', {
      initializing(instance, model) {
        // notify others or do stuff to instance
      },
      create(instance, model) {
        // do stuff to the instance or inspect the model.
      },
      destroy(instance, model) {
        // clean up.
      }
    });

    ioc.addLifecycleConcern(function (instance, model) {
      // determine when to apply this concern, could do a check on the instance
      return true; // always apply this concern.
    }, {
       create() { /* do stuff on create */ }
    });

## IocContainer#inject

    inject(obj, { deps })

Attempts to inject the dependencies of the object. If the object is a function
then the formal parameter names are used as dependency names when calling
`resolve()`. If a dependency cannot be found then an error is thrown.

The optional `deps` parameter is an array of dependency names  that will be
injected into the object. The order of the dependency names is important,
since function arguments are injected in the order they appear. Without
this parameter, dependency names are inferred automatically by inspecting the
formal parameter names of the function.

In addition to the `deps` parameter an `inject` array property or function on
the function (i.e. static) can be sepcified. However the `deps` parameter
will take precedence.

**Example:**

    ioc.config.set('port', 3000);
    ioc.constant('a', { name: 'a' });
    let o = ioc.inject(function (a, $port) {
      return { a: a, port: $port };
    }); // { a: { name: 'a' }, port: 3000 }

    // Using explicit dependency names in case our code is obfuscated.
    let o = ioc.inject(function (a, port) {
      return { a: a, port: port };
    }, { deps: ['a', '$port'] }); // { a: { name: 'a' }, port: 3000 }


## IocContainer#injectNewable

    injectNewable(Ctor, { deps })

Same as `inject()`, but accepts a constructor.

**Example:**

    ioc.config.set('port', 3000);
    ioc.constant('a', { name: 'a' });
    class T {
      static inject() { return ['a', '$port']; }

      constructor(a, port) {
        this.a = a;
        this.port = port;
      }
    }
    let t = ioc.injectNewable(T);


## IocContainer#dispose

    dispose()

Releases all managed instances, including singletons. Also nulls out the
parent container reference.


## IocContainer#on

    on(eventType, callback)

Registers a callback to be called when an event is fired. Returns an object
with a `off()` method that when called will remove the callback from the
internal list.


## IocContainer Events

- *dispose* Called when the container has been disposed
