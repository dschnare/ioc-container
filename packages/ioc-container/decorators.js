/*global IocContainer, inject, initializable, destroyable,
transient, service, factory, constant, decorate*/

// Convenience singleton ioc container that the service, facotry
// and constant decorators use to install services with.
IocContainer.app = new IocContainer();

// Convenience function to call decorators without using ES7 syntax.
/*
  Usage

  let MyService = decorate(
    transient,
    initializable,
    destroyable,
    inject(['a', 'b', 'c']),
    service('myService'),

    class MyService {
      constructor(a , b, c) {

      }
    }
  )
*/
decorate = function (...args) {
  let target = args.pop();
  let decorators = args;

  if (decorators.length === 0) {
    return target;
  }

  for (let decorator of decorators) {
    target = decorator(target);
  }

  return target;
};

function serviceDecorator(name, fn) {
  if (!IocContainer.app) {
    throw new Error('Failed to provide service because IocContainer.app is not defined.');
  }

  if (arguments.length === 2) {
    if (typeof fn !== 'function') {
      throw new Error('Service decorator can only accept functions as targets.');
    }
    IocContainer.app.service(name, fn);
    return fn;
  } else if (arguments.length == 1) {
    return function (target, key, def) {
      // Property descriptor
      if (arguments.length === 3) {
        throw new Error('Service decorator can only be used on classes.');
      // A function or constructor
      } else if (typeof target === 'function') {
        serviceDecorator(name, target);
      }

      return target;
    };
  } else {
    throw new Error('Service decorator must have a service name.');
  }
}

function factoryDecorator(name, fn) {
  if (!IocContainer.app) {
    throw new Error('Failed to provide service because IocContainer.app is not defined.');
  }

  if (arguments.length === 2) {
    if (typeof fn !== 'function') {
      throw new Error('Factory decorator can only accept functions as targets.');
    }
    IocContainer.app.factory(name, fn);
    return fn;
  } else if (arguments.length == 1) {
    return function (target, key, def) {
      // Property descriptor
      if (arguments.length === 3) {
        throw new Error('Factory decorator cannot be used on properties.');
      // A function or constructor
      } else if (typeof target === 'function') {
        factoryDecorator(name, target);
      }

      return target;
    };
  } else {
    throw new Error('Factory decorator must have a service name.');
  }
}

function constantDecorator(name, value) {
  if (!IocContainer.app) {
    throw new Error('Failed to provide service because IocContainer.app is not defined.');
  }

  if (arguments.length === 2) {
    if (value === null || value === undefined) {
      throw new Error('Constant decorator can only accept defined values.');
    }
    IocContainer.app.constant(name, value);
    return value;
  } else if (arguments.length == 1) {
    return function (target, key, def) {
      // Property descriptor
      if (arguments.length === 3) {
        throw new Error('Constant decorator cannot be used on properties.');
      // Any target.
      } else if (typeof target === 'function') {
        constantDecorator(name, target);
      }

      return target;
    };
  } else {
    throw new Error('Constant decorator must have a service name.');
  }
}

function injectDecorator(deps, fn) {
  if (arguments.length === 2) {
    if (typeof fn !== 'function') {
      throw new Error('Inject decorator can only accept functions as targets.');
    }
    fn.inject = deps;
    return fn;
  // ES7 decorator syntax used.
  } else if (arguments.length === 1) {
    return function (target, key, def) {
      // Property descriptor
      if (arguments.length === 3) {
        throw new Error('Inject decorator cannot be used on properties.');
      // A function or constructor
      } else if (typeof target === 'function') {
        target.inject = deps;
      }

      return target;
    };
  } else {
    throw new Error('Inject decorator must have dependency names passed in.');
  }
}

function transientDecorator(target, key, def) {
  if (arguments.length === 1) {
    if (typeof target !== 'function') {
      throw new Error('Transient decorator can only accept functions as targets.');
    }
    target.transient = true;
    return target;
  // Property descriptor
  } else if (arguments.length === 3) {
    throw new Error('Transient decorator cannot be used on properties.');
  } else if (arguments.length === 0) {
    return transientDecorator;
  } else {
    throw new Error('Transient decorator used incorectly.');
  }
}

function initializableDecorator(target, key, def) {
  if (arguments.length === 1) {
    if (typeof target !== 'function') {
      throw new Error('Initializable decorator can only accept functions as targets.');
    }
    target.initializable = true;
    return target;
  // Property descriptor
  } else if (arguments.length === 3) {
    throw new Error('Initializable decorator cannot be used on properties.');
  } else if (arguments.length === 0) {
    return initializableDecorator;
  } else {
    throw new Error('Initializable decorator used incorectly.');
  }
}

function destroyableDecorator(target, key, def) {
  if (arguments.length === 1) {
    if (typeof target !== 'function') {
      throw new Error('Destroyable decorator can only accept functions as targets.');
    }
    target.destroyable = true;
    return target;
  // Property descriptor
  } else if (arguments.length === 3) {
    throw new Error('Destroyable decorator cannot be used on properties.');
  } else if (arguments.length === 0) {
    return destroyableDecorator;
  } else {
    throw new Error('Destroyable decorator used incorectly.');
  }
}

IocContainer.decorate = decorate;
IocContainer.serviceDecorator = serviceDecorator;
IocContainer.factoryDecorator = factoryDecorator;
IocContainer.constantDecorator = constantDecorator;
IocContainer.injectDecorator = injectDecorator;
IocContainer.transientDecorator = transientDecorator;
IocContainer.initailizableDecorator = initializableDecorator;
IocContainer.destroyableDecorator = destroyableDecorator;

service = serviceDecorator;
factory = factoryDecorator;
constant = constantDecorator;
inject = injectDecorator;
transient = transientDecorator;
initializable = initializableDecorator;
destroyable = destroyableDecorator;