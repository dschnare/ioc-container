# 1.1.3

**Jan. 21, 2016**

fix(config) Ensure the $config factory is transient

Ensure the transient option for the $config factory is set to true, otherwise
the same object will be returned each time $config is resolved. This may lead
to missing keys on the config object being returned.

Refactor valueOf() to return a shallow copy of the intenral config object.


# 1.1.2

**Jan. 21, 2016**

docs(service, factory) Add docs describing new properties

Add docs to describe the support for the transient, initializable and
destroyable static properties on services and factories.


# 1.1.1

**Jan. 21, 2016**

test(service, factory) Add test for properties on services and factories

Add a check in tests to ensure transient, inject and destroyable properties
are overridden by the options used when registering the service or factory.


# 1.1.0

**Jan. 21, 2016**

feat(IocContainer) Add support for properties on services and factories

Add support for transient, initializable and destroyable properties on
service constructors and factory functions. These properties can either be a
function that returns a truthy value or a these properties can be a truthy
value.

The transient, initializable and destroyable options used when registering the
service or factory will take precedence over the any properties on the service
or factory being registered.



# 1.0.0

**Jan. 5, 2016**

refactor(install) Split install method into three methods

Refactor install() to be three separate methods, service(), factory() and
constant(). The reason for this was because it was getting hard to keep in mind
all the side affects of install() with all the different arguments accepted.

Each method now also looks for an inject array property or method on the
service constructor or factory function. If one does not exist then uses the
inject array argument passed to the function.

Each method also accepts options that determine if the service instance is
initializable (an initialize method should be called if it exists) and
destroyable (a destroy method should be called if it exists). By default
service instances will not have their initialize or destroy methods called
without setting these options to true. This was done this way to support
factory methods returning objects that have their own initialize and/or destroy
methods that must not be called (i.e. initialize being called multiple times
causing an error to be thrown). With these options service authors now have
more control over whether their service instances will have their initialize
or destroy methods called.

BREAKING CHANGE: Services can no longer be installed by calling install(). As
a workaround use service() to install constructors, factory() to install
functions and constant() to install any other value.

Also service instances will no longer have the initialize and destroy methods
called without the initializable and destroyable options being set to true when
registering the service via service() or factory().

Before

    ioc.install('serviceA', class {
      constructor() {}
      initialize() {}
      destroy() {}
    }, { newable: true })

    ioc.install('serviceB', function () {
      return {
        initialize() {},
        destroy() {}
      }
    })

    ioc.install('serviceC', {
      initialize() {},
      destroy() {}
    })

After

    ioc.service('serviceA', class {
      constructor() {}
      initialize() {}
      destroy() {}
    }, { initializable: true, destroyable: true })

    ioc.factory('serviceB', function () {
      return {
        initialize() {},
        destroy() {}
      }
    }, { initializable: true, destroyable: true })

    ioc.constant('serviceC', {
      initialize() {}, /* won't be called */
      destroy() {} /* won't be called */
    })


# 0.2.0

**Dec. 30, 2015**

- Add `deps` parameter to `inject()` to accommodate obfuscated code.

- Add `inject` parameter to `install()` to accommodate obfuscated code.

- Deprecate automatic property dependency injection. This will end in messy
  array access notation code if code is obfuscated. Dependencies can only be
  injected into functions.


# 0.1.3

**Dec. 29, 2015**

- Add `concerns` parameter to `install()` for convenience so that concerns can
  be added at the same time the service is installed.


# 0.1.2

**Dec. 29, 2015**

- Fix issue with adding `initializing` lifecycle concern. The concern was being
  ignored.


# 0.1.1

**Dec. 29, 2015**

- Fix dependency injection for primitive types so that array values don't have
  any dependencies injected and property name dependencies work as expected
  now.


# 0.1.0

**Dec. 29, 2015**

- Remove `initializing` callback parameter to `resolve()` and relpace it with
  an `initializing` lifecycle concern.


# 0.0.81

**Dec. 29, 2015**

- Add `initializing` callback parameter to `resolve()` so that the caller can
  perform some pre-initializing work before an instance's `initialize` method
  is called.


# 0.0.8

**Dec. 28, 2015**

- Fix issue with dependency injection with primitive values.


# 0.0.7

**Dec. 25, 2015**

- Rename property `_parentContainer` to `parentContainer` so that it is not
  meant to be private.


# 0.0.6

**Dec. 24, 2015**

- Prevent dependency injection when `inject()` is called with a primitive value.


# 0.0.5

**Dec. 22, 2015**

- Add support for installing primitive values. Primitive values will not have dependencies injected.


# 0.0.4

**Dec. 22, 2015**

- Add missing section to reference docs for `addLifecycleConcern()`.


# 0.0.3

**Dec. 21, 2015**

- Automatically null out properties that have been set to a managed instance.


# 0.0.2

**Dec. 21, 2015**

- Properties that are prefixed with `_` are skipped when dependencies are being
  injected.

- Only properties that are set to `null` will be injected as dependencies.


# 0.0.1

**Dec. 21, 2015**

- Initial release.