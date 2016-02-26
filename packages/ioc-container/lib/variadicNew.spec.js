Tinytest.add('variadicNew -- should throw an error when more than 9 arguments are used', (test) => {
  let ctor = function () {}
  let args = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  test.throws(function () {
    variadicNew(ctor, args)
  })
})

Tinytest.add('variadicNew -- should construct with zero arguments', (test) => {
  let ctor = function () { this.length = arguments.length }
  let o = variadicNew(ctor)
  test.equal(o.length, 0, 'expect no arguments to be passed')
})

Tinytest.add('variadicNew -- should construct with 2 arguments', (test) => {
  let ctor = function (a, b) { this.a = a; this.b = b }
  let o = variadicNew(ctor, [10, 'bee'])
  test.equal(o.a, 10, 'expect first argument to be 10')
  test.equal(o.b, 'bee', 'expect second argument to be "bee"')
})

Tinytest.add('variadicNew -- should construct with 4 arguments', (test) => {
  let ctor = function () { this.args = [].slice.call(arguments) }
  let o = variadicNew(ctor, [1, 2, 3, 4])
  test.equal(o.args.join(','), '1,2,3,4', 'expect arguments to be "1,2,3,4"')
})
