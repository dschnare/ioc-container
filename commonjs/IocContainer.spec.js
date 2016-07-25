"use strict";
var tape_1 = require('tape');
var IocContainer_1 = require('./IocContainer');
tape_1.test('IocContainer', function (t) {
    t.test('should throw error after being destroyed when any method is invocted', function (t) {
        var ioc = new IocContainer_1.IocContainer();
        var instance = null;
        ioc.destroy();
        t.throws(function () { return ioc.release(instance); });
        t.throws(function () { return ioc.destroy(); });
        t.throws(function () { return ioc.beginScope(); });
        t.throws(function () { return ioc.endScope(); });
        t.throws(function () { return ioc.addLifecycleConcerns('myInstance', {}); });
        t.throws(function () { return ioc.instance('n', instance); });
        t.throws(function () { return ioc.singleton('n', instance); });
        t.throws(function () { return ioc.transient('n', instance); });
        t.end();
    });
    t.test('should throw when resolving nonexistant service', function (t) {
        var ioc = new IocContainer_1.IocContainer();
        t.throws(function () { return ioc.resolve('nothing'); });
        t.end();
    });
    t.test('should resolve multiple services at once', function (t) {
        var ioc = new IocContainer_1.IocContainer();
        ioc.instance('one', 1);
        ioc.singleton('two', function () { return 2; });
        ioc.singleton('three', function () { return 3; });
        t.equal(ioc.resolve('one', 'two', 'three').join(','), '1,2,3');
        t.end();
    });
    t.test('should release multiple services at once', function (t) {
        var ioc = new IocContainer_1.IocContainer();
        ioc.transient('one', function () {
            return {
                destroy: function () { this.destroyed = true; }
            };
        });
        ioc.transient('two', function () {
            return {
                destroy: function () { this.destroyed = true; }
            };
        });
        ioc.transient('three', function () {
            return {
                destroy: function () { this.destroyed = true; }
            };
        });
        var instances = ioc.resolve('one', 'two', 'three');
        var other = ioc.resolve('one', 'two', 'three');
        ioc.release.apply(ioc, instances);
        t.ok(instances[0].destroyed, 'expected first instance to be destroyed');
        t.ok(instances[1].destroyed, 'expected second instance to be destroyed');
        t.ok(instances[2].destroyed, 'expected third instance to be destroyed');
        t.notOk(other[0].destroyed, 'expected first other instance to not be destroyed');
        t.notOk(other[1].destroyed, 'expected second othe rinstance to not be destroyed');
        t.notOk(other[2].destroyed, 'expected third other instance to not be destroyed');
        t.end();
    });
    t.test('should register, resolve and release instance services', function (t) {
        var ioc = new IocContainer_1.IocContainer();
        var resolvedInstance = null;
        var instance = {
            destroy: function () { this.destroyed = true; }
        };
        ioc.instance('myInstance', instance);
        resolvedInstance = ioc.resolve('myInstance');
        t.ok(instance === resolvedInstance, 'expect instance to be resolved');
        resolvedInstance = ioc.resolve('myInstance');
        t.ok(instance === resolvedInstance, 'expect instance to be resolved');
        ioc.release(instance);
        t.notOk(instance.destroyed, 'expect instance to not be destroyed');
        t.ok(instance === ioc.resolve('myInstance'), 'expect instance to be resolved');
        ioc.destroy();
        t.ok(instance.destroyed, 'expect instance to be destroyed');
        t.throws(function () { return ioc.resolve('myInstance'); });
        t.end();
    });
    t.test('should register, resolve and release singleton services', function (t) {
        var ioc = new IocContainer_1.IocContainer();
        var callCount = 0;
        t.throws(function () { return ioc.singleton('mySingleton', {}); });
        ioc.singleton('mySingleton', function () {
            callCount += 1;
            return {
                destroy: function () { this.destroyed = true; }
            };
        });
        var instances = ioc.resolve('mySingleton', 'mySingleton');
        t.ok(instances[0] === instances[1], 'expect singleton instances to be the same');
        t.equal(callCount, 1, 'expect singleton class to be called once');
        ioc.resolve('mySingleton', 'mySingleton');
        t.equal(callCount, 1, 'expect singleton class to be called once');
        ioc.release.apply(ioc, instances);
        t.notOk(instances[0].destroyed, 'expect singleton instance to not be destroyed');
        t.notOk(instances[1].destroyed, 'expect singleton instance to not be destroyed');
        t.ok(instances[0] === ioc.resolve('mySingleton'), 'expect singleton to still resolve to same instance');
        ioc.destroy();
        t.ok(instances[0].destroyed, 'expect singleton instance to be destroyed');
        t.end();
    });
    t.test('should register, resolve and release singleton services (class)', function (t) {
        var ioc = new IocContainer_1.IocContainer();
        t.throws(function () { return ioc.singleton('mySingleton', {}); });
        ioc.singleton('mySingleton', (function () {
            function class_1() {
                this.constructor.callCount(1);
            }
            class_1.callCount = function (incr) {
                if (incr === void 0) { incr = 0; }
                if (!this._callCount)
                    this._callCount = 0;
                this._callCount += incr;
                return this._callCount;
            };
            class_1.prototype.destroy = function () {
                this.destroyed = true;
            };
            return class_1;
        }()), { isClass: true });
        var instances = ioc.resolve('mySingleton', 'mySingleton');
        t.ok(instances[0] === instances[1], 'expect singleton instances to be the same');
        t.equal(instances[0].constructor.callCount(), 1, 'expect singleton class to be called once');
        ioc.resolve('mySingleton', 'mySingleton');
        t.equal(instances[0].constructor.callCount(), 1, 'expect singleton class to be called once');
        ioc.release.apply(ioc, instances);
        t.notOk(instances[0].destroyed, 'expect singleton instance to not be destroyed');
        t.notOk(instances[1].destroyed, 'expect singleton instance to not be destroyed');
        t.ok(instances[0] === ioc.resolve('mySingleton'), 'expect singleton to still resolve to same instance');
        ioc.destroy();
        t.ok(instances[0].destroyed, 'expect singleton instance to be destroyed');
        t.end();
    });
    t.test('should register, resolve and release transient services', function (t) {
        var ioc = new IocContainer_1.IocContainer();
        var callCount = 0;
        t.throws(function () { return ioc.transient('myTransient', {}); });
        ioc.transient('one', function () {
            callCount += 1;
            return {
                name: 'one',
                destroy: function () { this.destroyed = true; }
            };
        });
        var instance = ioc.resolve('one');
        var others = ioc.resolve('one', 'one');
        t.equal(callCount, 3, 'expect transient factory to be called three times');
        ioc.release(instance);
        t.ok(instance.destroyed, 'expect transient to be destroyed');
        t.notOk(others[0].destroyed, 'expect first other transient not be destroyed');
        t.notOk(others[1].destroyed, 'expect second other transient not be destroyed');
        ioc.release.apply(ioc, others);
        t.ok(others[0].destroyed, 'expect first other transient to be destroyed');
        t.ok(others[1].destroyed, 'expect second other transient to be destroyed');
        t.end();
    });
    t.test('should register, resolve and release transient services (class)', function (t) {
        var ioc = new IocContainer_1.IocContainer();
        t.throws(function () { return ioc.transient('myTransient', {}); });
        ioc.transient('one', (function () {
            function class_2() {
                this.constructor.callCount(1);
                this.name = 'one';
            }
            class_2.callCount = function (incr) {
                if (incr === void 0) { incr = 0; }
                if (!this._callCount)
                    this._callCount = 0;
                this._callCount += incr;
                return this._callCount;
            };
            class_2.prototype.destroy = function () { this.destroyed = true; };
            return class_2;
        }()), { isClass: true });
        var instance = ioc.resolve('one');
        var others = ioc.resolve('one', 'one');
        t.equal(instance.constructor.callCount(), 3, 'expect transient class to be called three times');
        ioc.release(instance);
        t.notOk(instance === others[0], 'expect a new transient to be created each time');
        t.ok(instance.destroyed, 'expect transient to be destroyed');
        t.notOk(others[0].destroyed, 'expect first other transient not be destroyed');
        t.notOk(others[1].destroyed, 'expect second other transient not be destroyed');
        ioc.release.apply(ioc, others);
        t.ok(others[0].destroyed, 'expect first other transient to be destroyed');
        t.ok(others[1].destroyed, 'expect second other transient to be destroyed');
        t.end();
    });
    t.test('should release a service\'s dependencies when service is released', function (t) {
        var ioc = new IocContainer_1.IocContainer();
        ioc.instance('config', { port: 5005 });
        ioc.singleton('context', function () {
            return {
                touchManager: {
                    destroyed: false,
                    touched: false
                },
                reset: function () {
                    this.touchManager.destroyed = false;
                    this.touchManager.touched = false;
                }
            };
        });
        ioc.singleton('ViewManager', function (context) {
            return {
                destroy: function () {
                    this.destroyed = true;
                }
            };
        }, { deps: ['context'] });
        ioc.transient('TouchManager', function (context) {
            t.notEqual(context, undefined, 'expect context to be passed in to TouchManager');
            return {
                touch: function () {
                    context.touchManager.touched = true;
                },
                destroy: function () {
                    context.touchManager.destroyed = true;
                }
            };
        }, { deps: ['context'] });
        ioc.transient('view:home', function (config, vm, tm) {
            t.equal(config.port, 5005, 'expect config.port to be 5005');
            return {
                name: 'home',
                render: function () {
                    return "<div>" + config.port + "</div>";
                },
                touch: function () {
                    tm.touch();
                },
                destroy: function () {
                    this.destroyed = true;
                }
            };
        }, { deps: ['config', 'ViewManager', 'TouchManager'] });
        var home = ioc.resolve('view:home');
        var vm = ioc.resolve('ViewManager');
        var context = ioc.resolve('context');
        t.equal(home.render(), '<div>5005</div>', 'expect home view to render the port number');
        t.notOk(context.touchManager.touched);
        t.notOk(context.touchManager.destroyed);
        home.touch();
        t.ok(context.touchManager.touched);
        ioc.release(home);
        t.ok(home.destroyed, 'expect home to be destroyed');
        t.ok(context.touchManager.destroyed, 'expect touch manager to be destroyed when home view is released');
        t.notOk(vm.destroyed, 'expect view manager to not be destroyed when home view is released');
        context.reset();
        home = ioc.resolve('view:home');
        ioc.destroy();
        t.ok(context.touchManager.destroyed, 'expect touch manager to be destroyed when home view is released');
        t.ok(vm.destroyed, 'expect view manager to be destroyed');
        t.end();
    });
    t.test('should release all scoped service instances when scope is ended', function (t) {
        var ioc = new IocContainer_1.IocContainer();
        ioc.transient('one', function () {
            return {
                name: 'one',
                destroy: function () {
                    this.destroyed = true;
                }
            };
        });
        ioc.transient('two', function () {
            return {
                name: 'two',
                destroy: function () {
                    this.destroyed = true;
                }
            };
        });
        ioc.transient('three', function () {
            return {
                name: 'three',
                destroy: function () {
                    this.destroyed = true;
                }
            };
        });
        ioc.beginScope();
        var instances = ioc.resolve('one', 'two', 'three');
        ioc.endScope();
        for (var _i = 0, instances_1 = instances; _i < instances_1.length; _i++) {
            var instance = instances_1[_i];
            t.ok(instance.destroyed, 'expect scoped instance to be destroyed after scope ends');
        }
        t.end();
    });
    t.test('should resolve, and release services from a parent container', function (t) {
        var ioc = new IocContainer_1.IocContainer();
        var childIoc = new IocContainer_1.IocContainer();
        ioc.addChild(childIoc);
        ioc.transient('one', function () {
            return {
                name: 'one',
                destroy: function () {
                    this.destroyed = true;
                }
            };
        });
        childIoc.transient('two', function () {
            return {
                name: 'two',
                destroy: function () {
                    this.destroyed = true;
                }
            };
        });
        childIoc.transient('three', function () {
            return {
                name: 'three',
                destroy: function () {
                    this.destroyed = true;
                }
            };
        });
        ioc.beginScope();
        var instances = ioc.resolve('one', 'two', 'three');
        ioc.endScope();
        t.equal(instances.length, 3, 'expect three services resolved');
        t.equal(instances[0].name, 'one', 'expect first instance to be "one"');
        t.ok(instances[0].destroyed, 'expect first scoped instance to be destroyed after scope ends');
        t.equal(instances[1].name, 'two', 'expect second instance to be "two"');
        t.ok(instances[1].destroyed, 'expect second scoped instance to be destroyed after scope ends');
        t.equal(instances[2].name, 'three', 'expect third instance to be "three"');
        t.ok(instances[2].destroyed, 'expect third scoped instance to be destroyed after scope ends');
        instances = ioc.resolve('one', 'two', 'three');
        ioc.destroy();
        for (var _i = 0, instances_2 = instances; _i < instances_2.length; _i++) {
            var instance = instances_2[_i];
            t.ok(instance.destroyed, 'expect scoped instance to be destroyed after parent is destroyed');
        }
        t.throws(function () { return childIoc.detroy(); });
        t.end();
    });
    t.end();
});
