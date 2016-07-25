"use strict";
/*
  A general purpose map. Does not implement the entire ES2015 Map API.
  Also includes contains(key) method.
*/
var ES6Map = typeof Map === 'function' && Map;
var GenericMap = (function () {
    function GenericMap(_a) {
        var forceNoEs6Map = (_a === void 0 ? {} : _a).forceNoEs6Map;
        this._map = !forceNoEs6Map && ES6Map && new ES6Map();
        this._keys = [];
        this._values = [];
    }
    GenericMap.prototype.size = function () {
        if (this._map)
            return this._map.size;
        return this._keys.length;
    };
    GenericMap.prototype.get = function (key) {
        if (this._map)
            return this._map.get(key);
        var k = this._keys.indexOf(key);
        return this._values[k];
    };
    GenericMap.prototype.set = function (key, value) {
        if (this._map) {
            this._map.set(key, value);
            return this;
        }
        var k = this._keys.indexOf(key);
        if (k >= 0) {
            this._keys[k] = key;
            this._values[k] = value;
        }
        else {
            this._keys.push(key);
            this._values.push(value);
        }
        return this;
    };
    GenericMap.prototype.keys = function () {
        if (this._map) {
            var keys = [];
            var it = this._map.keys();
            while (true) {
                var result = it.next();
                if (result.done)
                    break;
                keys.push(result.value);
            }
            return keys;
        }
        return this._keys.slice();
    };
    GenericMap.prototype.values = function () {
        if (this._map) {
            var values = [];
            var it = this._map.values();
            while (true) {
                var result = it.next();
                if (result.done)
                    break;
                values.push(result.value);
            }
            return values;
        }
        return this._values.slice();
    };
    GenericMap.prototype.delete = function (key) {
        if (this._map)
            this._map.delete(key);
        var k = this._keys.indexOf(key);
        if (k >= 0) {
            this._keys.splice(k, 1);
            this._values.splice(k, 1);
        }
    };
    GenericMap.prototype.contains = function (key) {
        if (this._map)
            return this._map.get(key) !== void 0;
        return this._keys.indexOf(key) >= 0;
    };
    return GenericMap;
}());
exports.__esModule = true;
exports["default"] = GenericMap;
