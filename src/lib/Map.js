/*
  A general purpose map. Does not implement the entire ES2015 Map API.
  Also includes contains(key) method.
*/
var ES6Map = typeof Map === 'function' && Map
export default class GenericMap {
  constructor ({forceNoEs6Map} = {}) {
    this._map = !forceNoEs6Map && ES6Map && new ES6Map()
    this._keys = []
    this._values = []
  }

  size () {
    if (this._map) return this._map.size
    return this._keys.length
  }

  get (key) {
    if (this._map) return this._map.get(key)
    var k = this._keys.indexOf(key)
    return this._values[k]
  }

  set (key, value) {
    if (this._map) {
      this._map.set(key, value)
      return this
    }

    var k = this._keys.indexOf(key)
    if (k >= 0) {
      this._keys[k] = key
      this._values[k] = value
    } else {
      this._keys.push(key)
      this._values.push(value)
    }

    return this
  }

  keys () {
    if (this._map) {
      let keys = []
      let it = this._map.keys()
      while (true) {
        let result = it.next()
        if (result.done) break
        keys.push(result.value)
      }
      return keys
    }

    return this._keys.slice()
  }

  values () {
    if (this._map) {
      let values = []
      let it = this._map.values()
      while (true) {
        let result = it.next()
        if (result.done) break
        values.push(result.value)
      }
      return values
    }

    return this._values.slice()
  }

  delete (key) {
    if (this._map) this._map.delete(key)
    var k = this._keys.indexOf(key)
    if (k >= 0) {
      this._keys.splice(k, 1)
      this._values.splice(k, 1)
    }
  }

  contains (key) {
    if (this._map) return this._map.get(key) !== void 0
    return this._keys.indexOf(key) >= 0
  }
}
