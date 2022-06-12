import "./helpers/mode";

import { collect, reactivable, untrack } from '../src/ObserveReactive';

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

});