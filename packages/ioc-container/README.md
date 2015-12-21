# Overview

A simple IOC container for Meteor.


# Quick Start

Create a new project

    meteor create ioc-proj
    cd ioc-proj

Now open `ioc-proj.js` and replace the contents of that file with this quick start.

    if (Meteor.isClient) {
      class MyClass {
        constructor(myOtherClass, $port) {
          this._myOtherClass = myOtherClass;
          this.port = $port;
        }

        destroy() {
          this._myOtherClass = null;
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
          // do stuff to destroy myself like removing event listeners
          // and null references out.
          this.myOtherClass = null;
          this.myClass = null;
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


# Reference

The API reference is in [REFERENCE.md](REFERENCE.md).