import "./mode";
import { strictEqual } from "assert";
import { track, trackable, untrack, untrackable } from '../src/ObserveTrack';
import { observable } from "../src/Observable";
import { observeInfo } from "../src/ObserveInfo";

describe('Track', () => {

  it('track', (done) => {
    const model = observable({ a: 1, b: 2 });
    const { result, dependencies } = track(() => model.a);
    strictEqual(result, 1);
    const { id } = observeInfo(model);
    strictEqual(dependencies.has(`${id}.a`), true);
    strictEqual(dependencies.has(`${id}.b`), false);
    done();
  });

  it('创建 trackable 函数', (done) => {
    const model = observable({ a: 1, b: 2 });
    const func = trackable((num: number) => model.a + num);
    strictEqual(func(1), 2);
    done();
  });

  it('触发 trackable 重新执行', (done) => {
    const model = observable({ a: 2, b: 0 });
    const func = trackable(() => {
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
    const func = trackable(() => {
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
    const func = trackable(() => {
      model.b = model.a * 2;
      return model.b;
    });
    strictEqual(func(), 4);
    untrackable(() => model.a = 4)();
    strictEqual(model.b, 4);
    done();
  });

});