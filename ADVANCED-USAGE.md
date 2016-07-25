# Advanced Usage

The following sections describe advanced usage and solutions often found in
larger applications.


## IocContainer Instance Management

For most applications code can depend on the singleton instance default module
export to get an instance of an `IocContainer`.

    // iocInit.js
    import ioc, {IocContainer} from 'ioc-container/src/IocContainer'

    var area1 = new IocContainer()
    ioc.addChild(area1)

    // Install services on area1 ...

    var area2 = new IocContainer()
    ioc.addChild(area2)

    // Install services on area2 ...

For more complex cases application developers can choose to manage their own
singleton instnace.

    // ioc.js
    import modulesIoc, {IocContainer} from 'ioc-container/src/IocContainer'

    var appIoc = new IocContainer()
    appIoc.addChild(modulesIoc)

    // Install services on appIoc ...

    export default appIoc

In the above example, application code would depend on `ioc.js` to get an
instance of an `IocContainer`. Note that the intent of the default  module
export is for general application-level services, but also for insalling
module instances (see below for examples).


## With EcmaScript Modules

One of the major challenges with ES modules is mocking out modules for tests.
Using an `IocContainer` modules can be written in such a way that they can be
mocked out.

By using the `defaultInstance()` method, modules can install a service if one
does not exist and export a value for the module at the same time. This will
give earlier executed code a chance to provide a mocked instance of a module.
This depends on the mocking code executing before the "real" module's code.

*NOTE: Modules using this technique are expected to use the default module
export so there is no coupling with application code.*

Example:

    // config.js
    import ioc from 'ioc-container/src/IocContainer'

    export default ioc.defaultInstance('config', {
      port: 8000,
      api: '/api
    })


    // feature.js
    import ioc from 'ioc-container/src/IocContainer'
    import config from './config'

    export var doWork = ioc.defaultInstance('feature/doWork', function doWork () {
      // Use config.
    })

    // Test Suite Code //

    // config.mock.js
    import ioc from 'ioc-container/src/IocContainer'

    export default ioc.defaultInstance('config', {
      port: 4555,
      api: '/dev/api'
    })

    // test.js
    import 'config.mock.js'
    import config from './config'
    import {doWork} from '../feature.js'

    // our local config instance will be {port:4555, api:'/dev/api'}
    // doWork() will see config as {port:4555, api:'/dev/api'}
    doWork()
