/*
Calls a constructor with variadic arguments. Supports up to 9 arguments.
*/
variadicNew = function (ctor, args = []) {
  let a = args || []
  let C = ctor

  switch (a.length) {
    case 0: return new C()
    case 1: return new C(a[0])
    case 2: return new C(a[0], a[1])
    case 3: return new C(a[0], a[1], a[2])
    case 4: return new C(a[0], a[1], a[2], a[3])
    case 5: return new C(a[0], a[1], a[2], a[3], a[4])
    case 6: return new C(a[0], a[1], a[2], a[3], a[4], a[5])
    case 7: return new C(a[0], a[1], a[2], a[3], a[4], a[5], a[6])
    case 8: return new C(a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7])
    case 9: return new C(a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8])
    default: throw new Error('Too many arguments passed to constructor.')
  }
}
