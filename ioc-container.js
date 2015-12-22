/*global Meteor, Template, IocContainer*/
if (Meteor.isClient) {
  // A quick test
  class MyClass {
    constructor(myOtherClass, $port) {
      this._myOtherClass = myOtherClass;
      this.port = $port;
    }
  }

  class MyOtherClass {
    constructor($port) {
      this._port = $port;
    }
  }

  let myObj = {
    $port: null,
    myOtherClass: null,
    myClass: null,
    initialize() {
      console.log('myObj#initialize()', this.$port, this.myOtherClass, this.myClass);
    },
    destroy() {
      // do stuff to destroy myself like removing event listeners.
      // myOtherClass and myClass will automatically be nulled out for us.
      console.log('myObj#destroy()');
    }
  };

  Template.hello.onCreated(function () {
    let ioc = new IocContainer();
    ioc.config.set('port', 3000);
    // intall MyClass and MyOtherClass as singletons, also
    // since these are constructors we have to mark them as newable
    // (i.e. the new operator must be used to create new instances).
    ioc.install('myClass', MyClass, { newable: true });
    ioc.install('myOtherClass', MyOtherClass, { newable: true });
    // install myObj, but mark it as transient (i.e. not a singleton).
    // a new instance of myObj will be created each time myObj is resolved
    // since we installed it as transient.
    // NOTE: installed objects will be extended via Object.create() when
    // new instances are created.
    ioc.install('myObj', myObj, { transient: true });

    let obj = ioc.resolve('myObj');

    // NOTE: We could have managed obj ourselves by injecting manually...
    // let obj = ioc.inject(Object.create(myObj));
    // Then we would have to release its dependencies manually as well.

    // now I'm done with obj...
    ioc.release(obj);

    // or I can dispose the entire IOC container...
    ioc.dispose();
    // releasing all instances, including singletons.
    // singletons are only released when the IOC container managing them
    // is disposed (i.e. they exist as long as the IOC container that manges them
    // exists).
  });
}
