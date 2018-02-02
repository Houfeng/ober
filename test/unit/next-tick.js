const assert = require('assert');
const nextTick = require('../../lib/next-tick');

describe('nextTick', function () {

  it('异步执行', function (done) {
    let value = 0;
    setTimeout(() => {
      value++;
      console.log('nextTick', value);
      assert.equal(value, 4);
      done();
    });
    nextTick(() => {
      value++;
      console.log('nextTick', value);
      assert.equal(value, 2);
    });
    nextTick(() => {
      value++;
      console.log('nextTick', value);
      assert.equal(value, 3);
    });
    console.log('nextTick', value);
    assert.equal(value, 0);
    value++;
    console.log('nextTick', value);
  });

});