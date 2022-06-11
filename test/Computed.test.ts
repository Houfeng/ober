import "./helpers/mode";

import { computed, reactivable } from '../src/ObserveReactive';

import { AnyFunction } from "../src/ObserveUtil";
import { observable } from "../src/ObserveHof";
import { sleep } from './helpers/utils';
import { strictEqual } from "assert";

describe('Computed', () => {

  it('computed', async () => {
    const model = observable({ a: 2, b: 0 });
    let throwError: AnyFunction;
    const func = computed(() => {
      if (throwError) throwError('computed: unsubscribe failed');
      return model.b * model.a;
    });
    let times = 0;
    const reactive = reactivable(() => {
      if (throwError) throwError('reactive: unsubscribe failed');
      times++;
      const value = func();
      if (times === 1) strictEqual(value, 0, `+2 -${value}`);
      if (times === 2) strictEqual(value, 4, `+4 -${value}`);
      if (times === 3) strictEqual(value, 8, `+8 -${value}`);
    });
    reactive();
    await sleep(0);
    strictEqual(reactive.dependencies.size, 1);
    model.b = 2;
    await sleep(0);
    strictEqual(reactive.dependencies.size, 1);
    model.a = 4;
    await sleep(0);
    strictEqual(reactive.dependencies.size, 1);
    reactive.unsubscribe();
    throwError = (message) => {
      throw new Error(message);
    }
    model.a = 5;
    await sleep(0);
  });

});