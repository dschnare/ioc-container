"use strict";
var Map_1 = require('./Map');
var toString = Object.prototype.toString;
var ServiceEntry = (function () {
    function ServiceEntry(ioc, name, type, factory) {
        this.ioc = ioc;
        this.name = name;
        this.type = type;
        this.factory = factory;
        this.instances = new Map_1["default"]();
        this.concerns = {
            initializing: [],
            create: [],
            destroying: []
        };
    }
    ServiceEntry.prototype.release = function (instance) {
        var entry = this.instances.get(instance);
        if (entry) {
            var scope = entry.scope;
            this.instances.delete(instance);
            for (var _i = 0, _a = this.concerns.destroying; _i < _a.length; _i++) {
                var concern = _a[_i];
                concern(instance, this);
            }
            if (typeof instance.destroy === 'function') {
                instance.destroy();
            }
            if (scope) {
                while (scope.length) {
                    this.ioc.release(scope.pop());
                }
            }
        }
    };
    ServiceEntry.prototype.releaseAll = function () {
        for (var _i = 0, _a = this.instances.keys(); _i < _a.length; _i++) {
            var instance = _a[_i];
            this.release(instance);
        }
    };
    ServiceEntry.prototype.addLifecycleConcerns = function (concerns) {
        for (var key in this.concerns) {
            var concern = concerns[key];
            if (!concern)
                continue;
            if (toString.call(concern) === '[object Array]') {
                for (var _i = 0, concern_1 = concern; _i < concern_1.length; _i++) {
                    var c = concern_1[_i];
                    if (typeof c === 'function')
                        this.concerns[key].push(c);
                }
            }
            else if (typeof concern === 'function') {
                this.concerns[key].push(concern);
            }
        }
    };
    ServiceEntry.prototype.create = function () {
        var scope = [];
        var instance = this.factory(scope);
        if (instance !== null &&
            instance !== undefined &&
            !this.instances.contains(instance)) {
            this.instances.set(instance, { scope: scope });
            for (var _i = 0, _a = this.concerns.initializing; _i < _a.length; _i++) {
                var concern = _a[_i];
                concern(instance, this);
            }
            if (typeof instance.initialize === 'function') {
                instance.initialize();
            }
            for (var _b = 0, _c = this.concerns.create; _b < _c.length; _b++) {
                var concern = _c[_b];
                concern(instance, this);
            }
        }
        return instance;
    };
    ServiceEntry.prototype.destroy = function () {
        this.releaseAll();
        this.ioc = null;
        this.concerns = {};
    };
    return ServiceEntry;
}());
exports.__esModule = true;
exports["default"] = ServiceEntry;
