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
        $port: null,
        myOtherClass: null,
        myClass: null,
        initialize() {
          console.log('myObj#initialize()', this.$port, this.myOtherClass, this.myClass);
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
        // NOTE: installed objects will be extended via Object.create() when
        // new instances are created.
        ioc.install('myObj', myObj, { transient: true });

        let obj = ioc.resolve('myObj');

        // NOTE: We could have managed obj ourselves by injecting manually...
        // let obj = ioc.inject(Object.create(myObj));
        // Then we would have to release its dependencies manually as well.

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

    install(name, obj, { transient, newable })

Installs a new service that can be resolved with the specified name.
The obj can be a function or object. If an object then `Object.create()`
is used to create new instances. If a function then the function will be
called normally unless the `newable` option is specified. If `newable` is
set then the `new` operator will be used when calling the function.

All services are singletons, that is they are only created once and the same
instance is returned each time `resolve()` is called. If the `transient`
option is set then a new instance will be created each time `resolve()` is
called.

All services will have their dependencies injected automatically. For functions
the names of their formal parameters will be used as dependency names. If a
formal argument results with no service being found an error will be thrown.

For objects and the return value of functions, property names will be used as
dependency names only if they are set to `null`. Properties starting with `_`
are skipped over.

Any formal parameter or property that starts with `$` is considered a
configuration key, and will be set to the config key without the `$` prefix.

**Example:**

    class MyClass {
      constructor(a, $port) { this.a = a; this.port = $port; }
    }
    ioc.config.set('port', 3000);
    ioc.install('myClass', MyClass, { newable: true })
    ioc.install('a', { name: 'a', $port: null }, { transient: true });
    let myClass = ioc.resolve('myClass');

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
    ioc.install('b', {
      name: 'b',
      a: null,
    }, { transient: true }); // transient

    let b = ioc.resolve('b'); // { name: 'b', a: { name: 'a', initCount: 1 } }
    let a = ioc.resolve('a');
    b.a === a // true
    ioc.release(b);
    b.a // null

    b = ioc.resolve('b'); // { name: 'b', a: { name: 'a', initCount: 1 } }
    b.a === a // true


## IocContainer#addLifecycleConcern

    addLifecycleConcern(nameOrPredicate, { create, destroy })

Adds a lifecycle concern that will be called during a lifecycle event either
for a particular service or any service that satisfies the predicate.

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
      concerns?: [{ create, destroy }]
    }

**Example:**

    ioc.addLifecycleConcern('myClass', {
      create(instance, model) {
        // do stuff to the instance or inspect the model.
      },
      destroy(instance, model) {
        // clean up.
      }
    });

## IocContainer#inject

    inject(obj)

Attempts to inject the dependencies of the object. If the object is a function
then the formal parameter names are used as dependency names when calling
`resolve()`. For the return value of the function or objects, property
names that have a value of `null` and are not prefixed with `_` are used as
dependency names when calling `resolve()`. If a dependency cannot be found then
an error is thrown.

**Example:**

    ioc.config.set('port', 3000);
    ioc.install('a', { name: 'a' });
    let o ioc.inject(function (a, $port) {
      return { a: a, port: $port };
    }); // { a: { name: 'a' }, port: 3000 }


## IocContainer#injectNewable

    injectNewable(Ctor)

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
