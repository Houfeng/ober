import "./helpers/mode";

import { nextTick } from "../src/ObserveTick";
import { strictEqual } from "assert";

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