"use strict";
var tape_1 = require('tape');
var ServiceEntry_1 = require('./ServiceEntry');
tape_1.test.test('ServiceEntry', function (t) {
    t.test('should call initailize() on instance when new instance is created', function (t) {
        var ioc = { release: function () { } };
        var name = 'serviceName';
        var type = 'factory';
        var instance = {
            initialize: function () {
                this.initializeCalled = true;
            }
        };
        var factory = function (scope) {
            factory.called = true;
            factory.calledWith = scope;
            return instance;
        };
        var entry = new ServiceEntry_1["default"](ioc, name, type, factory);
        var createdInstance = entry.create();
        t.equal(entry.name, 'serviceName', 'expect service entry name to be "serviceName"');
        t.equal(entry.type, 'factory', 'expect service entry type to be "factory"');
        t.ok(createdInstance === instance, 'expect created instance to equal our instance');
        t.ok(factory.called, 'expect factory to be called');
        t.ok(Array.isArray(factory.calledWith), 'expect factory to be passed an array');
        t.ok(instance.initializeCalled, 'expect initialize method to be called');
        t.ok(entry.instances.contains(instance), 'expect the instance to be saved');
        t.end();
    });
    t.test('should release an instance created by the entry', function (t) {
        var ioc = { release: function () { } };
        var name = 'serviceName';
        var type = 'factory';
        var factory = function () {
            return {
                destroy: function () {
                    this.destroyCalled = true;
                }
            };
        };
        var entry = new ServiceEntry_1["default"](ioc, name, type, factory);
        var instance = entry.create();
        entry.release(null);
        t.notOk(instance.destroyCalled, 'expect instance.destroy() not to be called');
        entry.release({});
        t.notOk(instance.destroyCalled, 'expect instance.destroy() not to be called');
        entry.release(instance);
        t.ok(instance.destroyCalled, 'expect instance.destroy() not to be called');
        t.notOk(entry.instances.contains(instance), 'expect instance to be removed from instances map');
        t.end();
    });
    t.test('should call lifecycle concerns for factory service types', function (t) {
        var ioc = { release: function () { } };
        var name = 'serviceName';
        var type = 'factory';
        var concerns = {
            initializing: function () { concerns.initializingCalled = true; },
            create: [
                function () { concerns.createCalled = true; }
            ],
            destroying: [
                function () { concerns.destroyingCalled = true; }
            ]
        };
        var factory = function () {
            return {};
        };
        var entry = new ServiceEntry_1["default"](ioc, name, type, factory);
        entry.addLifecycleConcerns(concerns);
        var instance = entry.create();
        t.ok(concerns.initializingCalled, 'expect initializing lifecycle concern to be called');
        t.ok(concerns.createCalled, 'expect create lifecycle concern to be called');
        entry.release(instance);
        t.ok(concerns.destroyingCalled, 'expect destroying lifecycle concern to be called');
        concerns.destroyingCalled = false;
        entry.release(instance);
        t.notOk(concerns.destroyingCalled, 'expect destroying lifecycle concern not to be called');
        t.end();
    });
    t.test('should call lifecycle concerns once for singleton service types', function (t) {
        var ioc = { release: function () { } };
        var name = 'serviceName';
        var type = 'singleton';
        var instance = null;
        var concerns = {
            initializing: [
                function () { concerns.initializingCalled = true; }
            ],
            create: function () { concerns.createCalled = true; },
            destroying: [
                function () { concerns.destroyingCalled = true; }
            ]
        };
        var factory = function () {
            instance = instance || {};
            return instance;
        };
        var entry = new ServiceEntry_1["default"](ioc, name, type, factory);
        entry.addLifecycleConcerns(concerns);
        var createdInstance = entry.create();
        t.ok(concerns.initializingCalled, 'expect initializing lifecycle concern to be called');
        t.ok(concerns.createCalled, 'expect create lifecycle concern to be called');
        concerns.initializingCalled = false;
        concerns.createCalled = false;
        createdInstance = entry.create();
        t.ok(createdInstance === instance, 'expect the same instance to be returned');
        t.notOk(concerns.initializingCalled, 'expect initializing lifecycle concern not to be called');
        t.notOk(concerns.createCalled, 'expect create lifecycle concern not to be called');
        entry.release(instance);
        t.ok(concerns.destroyingCalled, 'expect destroying lifecycle concern to be called');
        t.end();
    });
    t.test('should release all instances in scope passed to factory', function (t) {
        var ioc = {
            released: [],
            release: function (inst) {
                this.released.push(inst);
            }
        };
        var name = 'serviceName';
        var type = 'factory';
        var deps = [{}, {}, {}];
        var factory = function (scope) {
            var instance = {};
            scope.push.apply(scope, deps);
            return instance;
        };
        var entry = new ServiceEntry_1["default"](ioc, name, type, factory);
        var instance = entry.create();
        entry.release(instance);
        t.equal(ioc.released.length, 3, 'expect 3 dependencies to be released');
        t.ok(deps.indexOf(ioc.released[0]) >= 0);
        t.ok(deps.indexOf(ioc.released[1]) >= 0);
        t.ok(deps.indexOf(ioc.released[2]) >= 0);
        t.end();
    });
    t.test('should release all instances created', function (t) {
        var ioc = { release: function () { } };
        var name = 'serviceName';
        var type = 'factory';
        var factory = function () {
            return {};
        };
        var entry = new ServiceEntry_1["default"](ioc, name, type, factory);
        entry.create();
        entry.create();
        entry.create();
        entry.create();
        t.equal(entry.instances.size(), 4, 'expect 4 instances to have been created and saved');
        entry.releaseAll();
        t.equal(entry.instances.size(), 0, 'expect all instances to have been released');
        t.end();
    });
    t.end();
});
