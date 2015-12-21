/*global variadicNew*/
variadicNew = function (Ctor, ...args) {
  switch (args.length) {
    case 0:
      return new Ctor();
    case 1:
      return new Ctor(args[0]);
    case 2:
      return new Ctor(args[0], args[1]);
    case 3:
      return new Ctor(args[0], args[1], args[2]);
    case 4:
      return new Ctor(args[0], args[1], args[2], args[3]);
    case 5:
      return new Ctor(args[0], args[1], args[2], args[3], args[4]);
    case 6:
      return new Ctor(args[0], args[1], args[2], args[3], args[4],
        args[5]);
    case 7:
      return new Ctor(args[0], args[1], args[2], args[3], args[4],
        args[5], args[6]);
    case 8:
      return new Ctor(args[0], args[1], args[2], args[3], args[4],
        args[5], args[6], args[7]);
    case 9:
      return new Ctor(args[0], args[1], args[2], args[3], args[4],
        args[5], args[6], args[7], args[8]);
    case 10:
      return new Ctor(args[0], args[1], args[2], args[3], args[4],
        args[5], args[6], args[7], args[8], args[9]);
    default:
      throw new Error('Too many arguments for constructor.');
  }
};