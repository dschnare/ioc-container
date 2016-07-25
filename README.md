# Overview

An IOC container.


# Install

Node:

    npm install @dschnare/ioc-container

Meteor:

    meteor add dschnare:ioc-container


# Quick Start

## ES6 (with Nodejs module resolution)

    import ioc from 'ioc-container/src/IocContainer'

    // Install our services.

    ioc.instance('config', {
      port: 8000,
      api: '/api'
    })

    ioc.transient('Widget', class Widget {
      // A config instance will be injected for us automatically.
      constructor (config) {
        this.type = 'Widget'
      }

      // Called by the IOC Container when this service is resolved.
      initialize () {
        this.view = document.createElement('div')
      }

      mount (parentElement) {
        parentElement.appendChild(this.view)
      }

      unmount () {
        this.view && this.view.parentElement && this.view.parentElement.removeChild(this.view)
      }

      // Called by the IOC Container when this instance is released.
      destroy () {
        this.unmount()
        this.view = null
      }
    }, { isClass: true, deps: ['config'] })


    // Our application code.

    import ioc from 'ioc-container/src/IocContainer'

    var widget = ioc.resolve('Widget')
    widget.mount(document.body)

    // Later when we're done with the widget instance...
    ioc.release(widget)
    widget = null


## Nodejs / CommonJS

    var ioc = require('@dschnare/ioc-container').default

    // Code as usual...

## Meteor 1.2.1+

    import ioc from 'meteor/dschnare:ioc-container'

    // Code as usual...



# API

## default

Singleton instance exported as part of the module interface and as a
convenience for module development. This singleton should meet the needs
of most applications, but application developers are always free to manage
their own `IocContainer` singleton instance.

## IocContainer

Constructor that creates an inversion of control container. Services
registered with an IOC container can implement the following lifecycle
methods on the instances they create.

    initialize()
    destroy()

If `initialize()` exists on the service instance then it will be called after
all `initializing` lifecycle concerns, but before the service instance has been
returned from calling the IOC container's `resolve()` method. This is a
convenient place to perform any specific initialization required by the obect
before application code gets access to the object.

If `destroy()` exists on the service instance then it will be called after the
service instance has been released from the IOC container. This is a good place
to perform any custom deallocation logic.

### Methods

**`IocContainer()`**

Constructs a new IOC container.

**`IocContainer.prototype.addChild(childIocContainer)`**

Adds a child `IocContainer` to this container.

**`IocContainer.prototype.removeChild(childIocContainer)`**

Removes a child `IocContainer` from this container.

**`IocContainer.prototype.resolve(...names)`**

Attempts to resolve one or more registered services. If only one service
name is specified then a single service instance will be returned,
otherwise an array of service instances will be returned.

Child containers will be searched if this container does not have the service
being resolved.

Throws an error if a service cannot be found.

**`IocContainer.prototype.tryResolve(...names)`**

Attempts to resolve one or more registered services, but instead of throwing
an error when a service can't be found returns null.

**`IocContainer.prototype.canResolve(name)`**

Determines if the specified service name can be resolved.

**`IocContainer.prototype.release(...instances)`**

Attempts to release one or more service instances. Only transient service
instances will be released, all other service instances will be released
when this container is destroyed.

Returns true if all instances were released, false otherwise.

**`IocContainer.prototype.beginScope()`**

Begins a scope that tracks all service instances that occur while the scope
is open.

Each call to beginScope() should be accompanied by a call to endScope().

**`IocContainer.prototype.endScope()`**

Ends or closes the current scope. All resolved instances tracked by the scope
will be released.

**`IocContainer.prototype.destroy()`**

Destroys this IOC container, any child containers and all resolved services.

**`IocContainer.prototype.addLifecycleConcerns(name, concerns)`**

Adds lifecycle concerns to a registered service. If the service has not been
registered yet then throws an error.

Where `concerns` is an object with the following shape:

    {
      initializing: function | function[],
      create: function | function[],
      destroying: function | function[]
    }

Each concern is a function that will be called with the service instance
and the service entry.

*Initializing* concerns are called immediately after a service instance
has been instantiated.

*Create* concerns are called immediately after *initializing* concerns
are called, but before the service instance is returned from the
container's `resolve()` method.

*Destroying* concerns are called before a service instance is about to be
destroyed after being released.

Example:

    import {IocContainer} from 'ioc-container/src/IocContainer'
    var ioc = new IocContainer()

    ioc.transient('MyClass', class MyClass {}, { isClass: true })
    ioc.addLifecycleConcerns('MyClass', {
      initializing: [
        function (instance, serviceEntry) {
          // This property will be available to the instance
          // during its initialize() call.
          instance._id = new Date().getTime()
        },
        function () {
          console.log('MyClass initializing')
        }
      ],
      create: function (instance, serviceEntry) {
        console.log('MyClass created')
      },
      destroying: function (instance) {
        // free up any special objects manually here.
        // MyClass' dependencies will be released and destroyed automatically.
        console.log('MyClass destroyed')
      }
    })

    var myClassInstance = ioc.resolve('MyClass')
    // 'MyClass initializing' logged
    // 'MyClass created' logged
    console.log(myClassInstance._id) // A date time value

    ioc.release(myClassInstance)
    // 'MyClass destroyed' logged

**`IocContainer.prototype.instance(name, instance, {concerns} = {concerns: {}})`**

Registers a service with instance lifetime.

Instances are service instances already instantated. These service instances have
the same lifetime as the IOC container so they will only be released when the
IOC container has been destroyed.

Returns the registered service instance.

Example:

    import {IocContainer} from 'ioc-container/src/IocContainer'

    var ioc = new IocContainer()
    ioc.instance('config', {
      port: 5000,
      wwwroot: './wwwroot'
    })

**`IocContainer.prototype.defaultInstance(name, instance, {concerns} = {concerns: {}})`**

Registers a service with instance lifetime if a service with the specified
name is not already registered.

Returns the already registered service instance if one is registered or
registers the service instance and returns the instance.

**`IocContainer.prototype.singleton(name, factory, {deps, isClass, concerns} = {deps: [], isClass: false, concerns: {})`**

Registers a service with singleton lifetime.

Singleton services are factory functions or constructors that will be called
to create a new service instance. After the first instance has been created
the same instance will be used each time the service is resolved. The service
instance has the same lifetime as the IOC container so it will only be
released when the IOC container has been destroyed. If dependencies are
specified then those dependencies are resolved as well and injected as
arguments to the factory.

See `IocContainer.prototype.addLifecycleConcerns` for details about the `concerns` option.

Example:

    import {IocContainer} from 'ioc-container/src/IocContainer'

    var ioc = new IocContainer()
    ioc.instance('config', {
      port: 5000,
      wwwroot: './wwwroot'
    })
    ioc.singleton('App', class App {
      constructor (config) {
        console.log(config.port)
      }
    }, { deps: ['config'], isClass: true })

**`IocContainer.prototype.transient(name, factory, {deps, isClass, concerns} = {deps: [], isClass: false, concerns: {})`**

Registers a service with transient lifetime.

Transient services are factory functions or constructors that will be called
to create a new service instance. Each time the service is resolved a new
service instance will be created. If dependencies are specified then those
dependencies are resolved as well and injected as arguments to the factory.

See `IocContainer.prototype.addLifecycleConcerns` for details about the `concerns` option.

Example:

    import {IocContainer} from 'ioc-container/src/IocContainer'

    var ioc = new IocContainer()
    ioc.instance('config', {
      port: 5000,
      wwwroot: './wwwroot'
    })
    ioc.transient('HomeView', function (config) {
      return {
        render () {
          return '<h1>Home Sweet Home</h1>'
        }
      }
    }, { deps: ['config'] })
    ioc.singleton('App', class App {
      constructor (config, view) {
        console.log(config.port)
        console.log(view.render())
      }
    }, { deps: ['config', 'HomeView'], isClass: true })

---

## ServiceEntry

A service entry is an object that represents a service registration entry.

### Properties

**`name`**

The registered service name.

**`type`**

The lifetime type of the service. One of `'instance'`, `'transient'` or
`'singleton'`.
