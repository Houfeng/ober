import "./mode";
import { strictEqual } from "assert";
import { nextTick } from "../src/Tick";

describe('Tick', () => {

  it('异步执行', (done) => {
    let value = 0;
    setTimeout(() => {
      value++;
      strictEqual(value, 4);
      done();
    });
    nextTick(() => {
      value++;
      strictEqual(value, 2);
    });
    nextTick(() => {
      value++;
      strictEqual(value, 3);
    });
    strictEqual(value, 0);
    value++;
  });

});