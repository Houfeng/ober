import { equal } from "assert";
import { nextTick } from "../src/Tick";

describe('Tick', () => {

  it('异步执行', (done) => {
    let value = 0;
    setTimeout(() => {
      value++;
      equal(value, 4);
      done();
    });
    nextTick(() => {
      value++;
      equal(value, 2);
    });
    nextTick(() => {
      value++;
      equal(value, 3);
    });
    equal(value, 0);
    value++;
  });

});