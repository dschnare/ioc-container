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