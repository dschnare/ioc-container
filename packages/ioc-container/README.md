# Overview

A simple IOC container for Meteor.


# Quick Start

Create a new project

    meteor create ioc-proj
    cd ioc-proj

Now open `ioc-proj.js` and replace the contents of that file with this quick start.

    if (Meteor.isClient) {
      class MyClass {
        constructor(myOtherClass, $port) {
          this._myOtherClass = myOtherClass;
          this.port = $port;
        }
      }

      class MyOtherClass {
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
          // do stuff to destroy myself like removing event listeners
          // myOtherClass and myClass will automatically be nulled out for us.
          console.log('myObj#destroy()');
        }
      };

      Template.hello.onCreated(function () {
        let ioc = new IocContainer();
        ioc.config.set('port', 3000);
        // intall MyClass and MyOtherClass as singletons, also
        // since these are constructors we have to mark them as newable
        // (i.e. the new operator must be used to create new instances).
        ioc.install('myClass', MyClass, { newable: true });
        ioc.install('myOtherClass', MyOtherClass, { newable: true });
        // install myObj, but mark it as transient (i.e. not a singleton).
        // a new instance of myObj will be created each time myObj is resolved
        // since we installed it as transient.
        ioc.install('myObj', ($port, myClass, myOtherClass) => {
          let obj = Object.create(myObj);
          obj.port = $port;
          obj.myClass = myClass;
          obj.myOtherClass = myOtherClass;
          return obj;
        }, { transient: true });

        let obj = ioc.resolve('myObj');

        // now I'm done with obj...
        ioc.release(obj);

        // or I can dispose the entire IOC container...
        ioc.dispose();
        // releasing all instances, including singletons.
        // singletons are only released when the IOC container managing them
        // is disposed (i.e. they exist as long as the IOC container that manges them
        // exists).
      });
    }


# Reference

## IocContainer()

    IocContainer(parentContainer)

Constructs a new intance of an IOC container with an optional parent IOC
conatiner. If a parent container is specified then `resolve()` will traverse
into the parent container if the resolution fails using this own container.


## IocContainer#install

    install(name, obj, { newable, transient, concerns, inject })

Installs a new service that can be resolved with the specified name.
The obj can be a function, object or primitive value. If a function then the
function will be called normally unless the `newable` option is specified. If
`newable` is set then the `new` operator will be used when calling the
function. If an object is installed then the new instances are created by
calling `Object.create()`, but no dependencies will be injected. If any other
value then it will be returned without modification and no dependencies will be
injected.

All services are singletons, that is they are only created once and the same
instance is returned each time `resolve()` is called. If the `transient`
option is set then a new instance will be created each time `resolve()` is
called.

The opional `concerns` parameter is an object used to register lifecycle
concerns by calling `addLifecycleConcern()`. For information on adding
lifecycle concerns see the docs on this method.

The optional `inject` parameter is an array of dependency names that will be
injected into the service. The order of the dependency names is important,
since function arguments are injected first in the order they appear.
Without this parameter, dependency names are inferred automatically by
inspecting the formal parameter names of functions/constructors. Any dependency
name that starts with `$` will have the value of the config key without the `$`
prefix injected. This parameter is useful if your code is obfuscated.

All services can optionally define `initialize` and `destroy` methods that will
be called after dependencies have been injected and when the service has been
released respectively.

**Example:**

    class MyClass {
      constructor(a, $port) { this.a = a; this.port = $port; }

      initialize() {
        console.log('MyClass#initialize');
      }
    }
    ioc.config.set('port', 3000);
    ioc.install('myClass', MyClass, { newable: true })
    ioc.install('a', ($port) => {
      return { name: 'a', port: $port };
    }, { transient: true });
    let myClass = ioc.resolve('myClass');

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

**Example:**

    ioc.config.set('port', 3000);
    ioc.resolve('$port') // 3000
    ioc.install('a', { name: 'a', $port: null });
    ioc.resolve('a'); // { name: 'a', $port: 3000 }


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

    ioc.install('a', {
      name: 'a',
      initCount: 0,
      initialize() {
        this.initCount += 1;
      }
    }) // singleton
    ioc.install('b', (a) => {
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
        // notify others or do stuff to intance
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
since function arguments are injected first in the order they appear. Without
this parameter, dependency names are inferred automatically by inspecting the
formal parameter names of functions/constructors. Any dependency name that
starts with `$` will have the value of the config key without the `$` prefix
injected. This parameter is useful if your code is obfuscated.

**Example:**

    ioc.config.set('port', 3000);
    ioc.install('a', { name: 'a' });
    let o ioc.inject(function (a, $port) {
      return { a: a, port: $port };
    }); // { a: { name: 'a' }, port: 3000 }

    // Using explicit dependency names in case our code is obfuscated.
    let o = ioc.inject(function (a) {
      return { a: a };
    }, { deps: ['a', '$port'] }); // { a: { name: 'a' }, $port: 3000 }


## IocContainer#injectNewable

    injectNewable(Ctor, { deps })

Same as `inject()`, but accepts a constructor.

**Example:**

    ioc.config.set('port', 3000);
    ioc.install('a', { name: 'a' });
    class T {
      constructor(a, $port) {
        this.a = a;
        this.port = $port;
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
