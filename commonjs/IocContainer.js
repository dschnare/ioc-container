"use strict";
var ServiceEntry_1 = require('./lib/ServiceEntry');
var IocContainerGroupMixin_1 = require('./lib/IocContainerGroupMixin');
var LifetimeType = {
    instance: 'instance',
    singleton: 'singleton',
    transient: 'transient'
};
var ErrorMessages = {
    DESTROYED: 'Ioc container has been destroyed. No method invocations are permitted.'
};
exports.IocContainer = IocContainerGroupMixin_1["default"]((function () {
    function class_1() {
        this._registry = {}; // key: serviceName, value: ServiceEntry
        this._scopes = []; // array of array of service instances
        this._destroyed = false;
    }
    class_1.prototype.canResolve = function (serviceName) {
        if (this._destroyed)
            throw new Error(ErrorMessages.DESTROYED);
        return serviceName in this._registry;
    };
    class_1.prototype.resolve = function () {
        var serviceNames = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            serviceNames[_i - 0] = arguments[_i];
        }
        if (this._destroyed)
            throw new Error(ErrorMessages.DESTROYED);
        var resolved = [];
        for (var _a = 0, serviceNames_1 = serviceNames; _a < serviceNames_1.length; _a++) {
            var serviceName = serviceNames_1[_a];
            var entry = this._registry[serviceName];
            var instance = null;
            if (entry) {
                instance = entry.create();
            }
            if (instance === null || instance === undefined) {
                throw new Error('Service not found "' + serviceName + '"');
            }
            this._addToCurrentScope(instance);
            resolved.push(instance);
        }
        return resolved.length === 1 ? resolved[0] : resolved;
    };
    class_1.prototype.tryResolve = function () {
        var serviceNames = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            serviceNames[_i - 0] = arguments[_i];
        }
        try {
            return this.resolve.apply(this, serviceNames);
        }
        catch (_) {
            return null;
        }
    };
    class_1.prototype.release = function () {
        var instances = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            instances[_i - 0] = arguments[_i];
        }
        if (!this._registry)
            throw new Error(ErrorMessages.DESTROYED);
        var released = false;
        for (var _a = 0, instances_1 = instances; _a < instances_1.length; _a++) {
            var instance = instances_1[_a];
            if (instance) {
                var serviceEntry = this._lookupServiceEntryByInstance(instance);
                if (serviceEntry) {
                    if (this._destroyed ||
                        (serviceEntry.type === LifetimeType.transient &&
                            !this._isInstanceDependedOn(instance))) {
                        serviceEntry.release(instance);
                        released = true;
                    }
                }
            }
        }
        return released;
    };
    class_1.prototype.beginScope = function () {
        if (this._destroyed)
            throw new Error(ErrorMessages.DESTROYED);
        this._scopes.push([]);
    };
    class_1.prototype.endScope = function () {
        if (this._destroyed)
            throw new Error(ErrorMessages.DESTROYED);
        var scope = this._scopes.pop();
        if (scope) {
            while (scope.length) {
                this.release(scope.pop());
            }
        }
    };
    class_1.prototype.destroy = function () {
        if (this._destroyed)
            throw new Error(ErrorMessages.DESTROYED);
        this._destroyed = true;
        for (var serviceName in this._registry) {
            this._registry[serviceName].destroy();
        }
        this._scopes = null;
        this._registry = null;
    };
    class_1.prototype.addLifecycleConcerns = function (serviceName, concerns) {
        if (this._destroyed)
            throw new Error(ErrorMessages.DESTROYED);
        var serviceEntry = this._registry[serviceName];
        if (serviceEntry) {
            serviceEntry.addLifecycleConcerns(concerns);
        }
        else {
            throw new Error('Service not found "' + serviceName + '"');
        }
    };
    class_1.prototype.instance = function (serviceName, instance, _a) {
        var concerns = (_a === void 0 ? { concerns: {} } : _a).concerns;
        if (this._destroyed)
            throw new Error(ErrorMessages.DESTROYED);
        if (instance === null || instance === undefined)
            throw new Error('Service instance must be defined.');
        var type = LifetimeType.instance;
        var ioc = this;
        var entry = this._registry[serviceName];
        if (entry instanceof ServiceEntry_1["default"]) {
            entry.destroy();
        }
        this._registry[serviceName] = new ServiceEntry_1["default"](ioc, serviceName, type, function () { return instance; });
        this._registry[serviceName].addLifecycleConcerns(concerns);
        return instance;
    };
    class_1.prototype.singleton = function (serviceName, factory, _a) {
        var _b = _a === void 0 ? { deps: [], isClass: false, concerns: {} } : _a, deps = _b.deps, isClass = _b.isClass, concerns = _b.concerns;
        if (this._destroyed)
            throw new Error(ErrorMessages.DESTROYED);
        if (typeof factory !== 'function') {
            throw new Error('Singleton service factory must be a function.');
        }
        var type = LifetimeType.singleton;
        var instance = null;
        var ioc = this;
        deps = deps || [];
        var entry = this._registry[serviceName];
        if (entry instanceof ServiceEntry_1["default"]) {
            entry.destroy();
        }
        this._registry[serviceName] = new ServiceEntry_1["default"](ioc, serviceName, type, function (scope) {
            if (instance === null) {
                var args = ioc.resolve.apply(ioc, deps);
                if (deps.length === 1)
                    args = [args];
                scope.push.apply(scope, args);
                /* eslint new-cap: 0 */
                instance = isClass ? new (factory.bind.apply(factory, [factory].concat(args))) : factory.apply(void 0, args);
            }
            return instance;
        });
        if (concerns) {
            this._registry[serviceName].addLifecycleConcerns(concerns);
        }
    };
    class_1.prototype.transient = function (serviceName, factory, _a) {
        var _b = _a === void 0 ? { deps: [], isClass: false, concerns: {} } : _a, deps = _b.deps, isClass = _b.isClass, concerns = _b.concerns;
        if (this._destroyed)
            throw new Error(ErrorMessages.DESTROYED);
        if (typeof factory !== 'function') {
            throw new Error('Transient service factory must be a function.');
        }
        var type = LifetimeType.transient;
        var ioc = this;
        deps = deps || [];
        var entry = this._registry[serviceName];
        if (entry instanceof ServiceEntry_1["default"]) {
            entry.destroy();
        }
        this._registry[serviceName] = new ServiceEntry_1["default"](ioc, serviceName, type, function (scope) {
            var args = ioc.resolve.apply(ioc, deps);
            if (deps.length === 1)
                args = [args];
            scope.push.apply(scope, args);
            /* eslint new-cap: 0 */
            return isClass ? new (factory.bind.apply(factory, [factory].concat(args))) : factory.apply(void 0, args);
        });
        if (concerns) {
            this._registry[serviceName].addLifecycleConcerns(concerns);
        }
    };
    class_1.prototype.defaultInstance = function (serviceName, instance, _a) {
        var concerns = (_a === void 0 ? { concerns: {} } : _a).concerns;
        return this.tryResolve(serviceName) || this.instance(serviceName, instance, { concerns: concerns });
    };
    class_1.prototype._isInstanceDependedOn = function (instance) {
        for (var serviceName in this._registry) {
            var entry = this._registry[serviceName];
            for (var _i = 0, _a = entry.instances.values(); _i < _a.length; _i++) {
                var instEntry = _a[_i];
                if (instEntry.scope.indexOf(instance) >= 0)
                    return true;
            }
        }
        return false;
    };
    class_1.prototype._addToCurrentScope = function (instance) {
        if (this._scopes.length)
            this._scopes[this._scopes.length - 1].push(instance);
    };
    class_1.prototype._lookupServiceEntryByInstance = function (instance) {
        for (var serviceName in this._registry) {
            if (this._registry[serviceName].instances.contains(instance))
                return this._registry[serviceName];
        }
    };
    return class_1;
}()));
exports.__esModule = true;
exports["default"] = new exports.IocContainer();
