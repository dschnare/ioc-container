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