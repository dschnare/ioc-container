"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
function IocContainerGroupMixin(Cls) {
    return (function (_super) {
        __extends(IocContainer, _super);
        function IocContainer() {
            _super.call(this);
            this._children = [];
        }
        IocContainer.prototype.addChild = function (ioc) {
            if (!(ioc instanceof IocContainer))
                throw new Error('Child must be an instance of IocContainer.');
            if (ioc._parent === this)
                return ioc;
            if (ioc._parent)
                ioc._parent.removeChild(ioc);
            ioc._parent = this;
            this._children.push(ioc);
        };
        IocContainer.prototype.removeChild = function (ioc) {
            if (ioc._parent === this) {
                ioc._parent = null;
                for (var i = 0, l = this._children.length; i < l; i++) {
                    if (this._children[i] === ioc) {
                        this._children.splice(i, 1);
                        break;
                    }
                }
            }
        };
        IocContainer.prototype.canResolve = function (name) {
            var canResolve = _super.prototype.canResolve.call(this, name);
            for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                var child = _a[_i];
                if (child.canResolve(name)) {
                    return true;
                }
            }
            return canResolve;
        };
        IocContainer.prototype.resolve = function () {
            var names = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                names[_i - 0] = arguments[_i];
            }
            var resolved = [];
            for (var _a = 0, names_1 = names; _a < names_1.length; _a++) {
                var name_1 = names_1[_a];
                if (_super.prototype.canResolve.call(this, name_1)) {
                    resolved.push(_super.prototype.resolve.call(this, name_1));
                }
                else {
                    var found = false;
                    for (var _b = 0, _c = this._children; _b < _c.length; _b++) {
                        var child = _c[_b];
                        if (child.canResolve(name_1)) {
                            var instance = child.resolve(name_1);
                            _super.prototype._addToCurrentScope.call(this, instance);
                            resolved.push(instance);
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        throw new Error('Service not found "' + name_1 + '"');
                    }
                }
            }
            return resolved.length === 1 ? resolved[0] : resolved;
        };
        IocContainer.prototype.release = function () {
            var instances = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                instances[_i - 0] = arguments[_i];
            }
            // Will throw for us if container is destroyed.
            if (!this._registry)
                return _super.prototype.release.call(this);
            var released = false;
            for (var _a = 0, instances_1 = instances; _a < instances_1.length; _a++) {
                var instance = instances_1[_a];
                if (_super.prototype._lookupServiceEntryByInstance.call(this, instance)) {
                    released = _super.prototype.release.call(this, instance);
                }
                else {
                    for (var _b = 0, _c = this._children; _b < _c.length; _b++) {
                        var child = _c[_b];
                        if (child._lookupServiceEntryByInstance(instance)) {
                            released = child.release(instance);
                            break;
                        }
                    }
                }
            }
            return released;
        };
        IocContainer.prototype.addLifeCycleConcerns = function (name, concerns) {
            if (_super.prototype.canResolve.call(this, name)) {
                _super.prototype.addLifeCycleConcerns.call(this, name, concerns);
            }
            else {
                for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                    var child = _a[_i];
                    if (child.canResolve(name)) {
                        child.addLifeCycleConcerns(name, concerns);
                        break;
                    }
                }
            }
        };
        IocContainer.prototype.destroy = function () {
            _super.prototype.destroy.call(this);
            while (this._children.length) {
                var child = this._children.pop();
                child.destroy();
                this.removeChild(child);
            }
        };
        return IocContainer;
    }(Cls));
}
exports.__esModule = true;
exports["default"] = IocContainerGroupMixin;
