const assert = require('assert');
const Observer = require('../../lib');
const EventEmitter = require('eify');

class Tester extends EventEmitter {
  constructor() {
    super();
    this.name = 'test';
  }
}

describe('Observer', function () {

  it('观察对象变化', function (done) {
    const obj = { name: 'bob', age: 20 };
    const ob = new Tester();
    done();
    // ob.run(()=>{
    //   console.log('run',obj.age);
    // });
    // obj.age=30;
  });

});

//Class constructor EventEmitter cannot be invoked without 'new'