createMap = function () {
  let es6Maps = typeof Map === 'function'
  let entries = es6Maps ? new Map() : []

  return {
    get (key) {
      if (es6Maps) return entries.get(key)

      for (let entry of entries) {
        if (entry.key === key) return entry.value
      }
    },

    set (key, value) {
      if (es6Maps) {
        entries.set(key, value)
        return this
      }

      for (let entry of entries) {
        if (entry.key === key) {
          entry.value = value
          return this
        }
      }

      entries.push({ key: key, value: value })
      return this
    },

    size () {
      if (es6Maps) return entries.size
      return entries.length
    },

    keys () {
      let keys = []

      if (es6Maps) {
        let it = entries.keys()
        while (true) {
          let result = it.next()
          if (result.done) break
          keys.push(result.value)
        }
      } else {
        for (let entry of entries) {
          keys.push(entry.key)
        }
      }

      return keys
    },

    values () {
      let values = []

      if (es6Maps) {
        let it = entries.values()
        while (true) {
          let result = it.next()
          if (result.done) break
          values.push(result.value)
        }
      } else {
        for (let entry of entries) {
          values.push(entry.value)
        }
      }

      return values
    },

    remove (key) {
      if (es6Maps) return entries.delete(key)

      for (let k = entries.length - 1; k >= 0; k -= 1) {
        if (entries[k].key === key) {
          entries.splice(k, 1)
          return true
        }
      }

      return false
    },

    contains (key) {
      if (es6Maps) return entries.get(key) !== undefined

      return entries.some((e) => e.key === key)
    }
  }
}
