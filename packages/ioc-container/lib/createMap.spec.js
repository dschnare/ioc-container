let before = (ctx) => {
  ctx.es6Maps = typeof Map === 'function'
  ctx.origMap = ctx.es6Maps ? Map : void 0
  if (ctx.es6Maps) Map = null
}

let after = (ctx) => {
  if (ctx.es6Maps) Map = ctx.origMap
}

Tinytest.add('createMap -- should create a simple es6 compliant map', (test) => {
  let ctx = {}; before(ctx)

  let map = createMap()
  test.isNotUndefined(map, 'expect map to have been created')

  after(ctx)
})

Tinytest.add('createMap -- should set string keys and can retrieve them', (test) => {
  let ctx = {}; before(ctx)

  let map = createMap()

  map.set('my key', 'my value')
  map.set('one', 'two')

  test.isTrue(map.contains('my key'), 'expect map to contain key "my key"')
  test.equal(map.get('my key'), 'my value', 'expect "my key" to be mapped to "my value"')
  test.isTrue(map.contains('one'), 'expect map to contain key "one"')
  test.equal(map.get('one'), 'two', 'expect "one" to be mapped to "two"')

  after(ctx)
})

Tinytest.add('createMap -- should set non-string keys and can retrieve them', (test) => {
  let ctx = {}; before(ctx)

  let map = createMap()
  let array = []
  let object = {}

  map.set(1, 2)
  map.set(array, 'an array')
  map.set(object, 'an object')

  test.isTrue(map.contains(1), 'expect map to contain key 1')
  test.equal(map.get(1), 2, 'expect 1 to be mapped to 2')
  test.isTrue(map.contains(array), 'expect map to contain key array')
  test.equal(map.get(array), 'an array', 'expect array to be mapped to "an array"')
  test.isTrue(map.contains(object), 'expect map to contain key object')
  test.equal(map.get(object), 'an object', 'expect object to be mapped to "an object"')

  after(ctx)
})

Tinytest.add('createMap -- should set keys and can remove them', (test) => {
  let ctx = {}; before(ctx)

  let map = createMap()
  let array = []
  let object = {}

  map.set('one', 'two')
  map.set(1, 2)
  map.set(array, 'an array')
  map.set(object, 'an object')

  test.isTrue(map.contains('one'), 'expect map to contain key "one"')
  map.remove('one')
  test.isFalse(map.contains('one'), 'expect map to not contain key "one"')

  test.isTrue(map.contains(1), 'expect map to contain key 1')
  map.remove(1)
  test.isFalse(map.contains(1), 'expect map to not contain 1')

  test.isTrue(map.contains(array), 'expect map to contain key array')
  map.remove(array)
  test.isFalse(map.contains(array), 'expect map to not contain array')

  test.isTrue(map.contains(object), 'expect map to contain key object')
  map.remove(object)
  test.isFalse(map.contains(object), 'expect map to not contain object')

  after(ctx)
})

Tinytest.add('createMap -- should return all keys when calling keys()', (test) => {
  let map = createMap()
  let array = []
  let object = {}

  map.set('one', 'two')
  map.set(1, 2)
  map.set(array, 'an array')
  map.set(object, 'an object')

  let keys = map.keys()
  test.equal(keys.length, 4, 'expect 4 keys')
  test.isTrue(keys[0], 'one')
  test.isTrue(keys[1], 1)
  test.isTrue(keys[2], array)
  test.isTrue(keys[3], object)
  test.equal(map.size(), 4, 'expect 4 keys')
})