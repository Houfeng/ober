import "./mode";

import { collect, computed, reactivable, untrack, untrackable } from '../src/ObserveReactive';

import { AnyFunction } from "../src/ObserveUtil";
import { observable } from "../src/ObserveHof";
import { observeInfo } from "../src/ObserveInfo";
import { strictEqual } from "assert";

describe('Reactivable', () => {

  it('collect', (done) => {
    const model = observable({ a: 1, b: 2 });
    const { result, dependencies } = collect(() => model.a);
    strictEqual(result, 1);
    const { id } = observeInfo(model);
    strictEqual(dependencies.has(`${id}.a`), true);
    strictEqual(dependencies.has(`${id}.b`), false);
    done();
  });

  it('创建 reactivable 函数', (done) => {
    const model = observable({ a: 1, b: 2 });
    const func = reactivable((num: number) => model.a + num);
    strictEqual(func(1), 2);
    done();
  });

  it('触发 reactivable 重新执行', (done) => {
    const model = observable({ a: 2, b: 0 });
    const func = reactivable(() => {
      model.b = model.a * 2;
      return model.b;
    });
    strictEqual(func(), 4);
    model.a = 4;
    strictEqual(model.b, 8);
    done();
  });

  it('untrack', (done) => {
    const model = observable({ a: 2, b: 0 });
    const func = reactivable(() => {
      model.b = model.a * 2;
      return model.b;
    });
    strictEqual(func(), 4);
    untrack(() => model.a = 4);
    strictEqual(model.b, 4);
    done();
  });

  it('untrackable', (done) => {
    const model = observable({ a: 2, b: 0 });
    const func = reactivable(() => {
      model.b = model.a * 2;
      return model.b;
    });
    strictEqual(func(), 4);
    untrackable(() => model.a = 4)();
    strictEqual(model.b, 4);
    done();
  });

  it('computed', (done) => {
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
      if (times === 1) strictEqual(value, 0, `times:${times} ${value}`);
      if (times === 2) strictEqual(value, 4, `times:${times} ${value}`);
      if (times === 3) strictEqual(value, 8, `times:${times}$ {value}`);
      if (times >= 3) done();
    });
    reactive();
    strictEqual(reactive.dependencies.size, 2);
    model.b = 2;
    strictEqual(reactive.dependencies.size, 1);
    model.a = 4;
    strictEqual(reactive.dependencies.size, 1);
    reactive.unsubscribe();
    throwError = (message) => {
      throw new Error(message);
    }
    model.a = 5;
  });

});