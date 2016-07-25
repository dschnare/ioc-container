import {test} from 'tape'
import Map from './Map'

test('Map', function (t) {
  t.test('should set string keys and can retrieve them', (t) => {
    let map = new Map({ forceNoEs6Maps: true })

    map.set('my key', 'my value')
    map.set('one', 'two')

    t.ok(map.contains('my key'), 'expect map to contain key "my key"')
    t.equal(map.get('my key'), 'my value', 'expect "my key" to be mapped to "my value"')
    t.ok(map.contains('one'), 'expect map to contain key "one"')
    t.equal(map.get('one'), 'two', 'expect "one" to be mapped to "two"')

    t.end()
  })

  t.test('should set non-string keys and can retrieve them', (t) => {
    let map = new Map({ forceNoEs6Maps: true })
    let array = []
    let object = {}

    map.set(1, 2)
    map.set(array, 'an array')
    map.set(object, 'an object')

    t.ok(map.contains(1), 'expect map to contain key 1')
    t.equal(map.get(1), 2, 'expect 1 to be mapped to 2')
    t.ok(map.contains(array), 'expect map to contain key array')
    t.equal(map.get(array), 'an array', 'expect array to be mapped to "an array"')
    t.ok(map.contains(object), 'expect map to contain key object')
    t.equal(map.get(object), 'an object', 'expect object to be mapped to "an object"')

    t.end()
  })

  t.test('should set keys and can delete them', (t) => {
    let map = new Map({ forceNoEs6Maps: true })
    let array = []
    let object = {}

    map.set('one', 'two')
    map.set(1, 2)
    map.set(array, 'an array')
    map.set(object, 'an object')

    t.ok(map.contains('one'), 'expect map to contain key "one"')
    map.delete('one')
    t.ok(!map.contains('one'), 'expect map to not contain key "one"')

    t.ok(map.contains(1), 'expect map to contain key 1')
    map.delete(1)
    t.ok(!map.contains(1), 'expect map to not contain 1')

    t.ok(map.contains(array), 'expect map to contain key array')
    map.delete(array)
    t.ok(!map.contains(array), 'expect map to not contain array')

    t.ok(map.contains(object), 'expect map to contain key object')
    map.delete(object)
    t.ok(!map.contains(object), 'expect map to not contain object')

    t.end()
  })

  t.test('should return all keys when calling keys()', (t) => {
    let map = new Map({ forceNoEs6Maps: true })
    let array = []
    let object = {}

    map.set('one', 'two')
    map.set(1, 2)
    map.set(array, 'an array')
    map.set(object, 'an object')

    let keys = map.keys()
    t.equal(keys.length, 4, 'expect 4 keys')
    t.ok(keys[0], 'one')
    t.ok(keys[1], 1)
    t.ok(keys[2], array)
    t.ok(keys[3], object)
    t.equal(map.size(), 4, 'expect 4 keys')

    t.end()
  })

  t.end()
})
