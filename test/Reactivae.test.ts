import { collect, untrack } from "../src";
import { observable } from "../src";
import { observeInfo } from "../src";
import { reactivable } from "../src";
import { strictEqual } from "node:assert";
import { describe, it } from "node:test";

describe("Reactivable", () => {
  it("collect", () => {
    const model = observable({ a: 1, b: 2 });
    const [result, dependencies] = collect(() => model.a);
    strictEqual(result, 1);
    const { id } = observeInfo(model);
    strictEqual(dependencies.has(`${id}.a`), true);
    strictEqual(dependencies.has(`${id}.b`), false);
  });

  it("创建 reactivable 函数", () => {
    const model = observable({ a: 1, b: 2 });
    const func = reactivable((num: number) => model.a + num);
    console.log('++++++++++++', func(1))
    strictEqual(func(1), 2);
  });

  it("触发 reactivable 重新执行", () => {
    const model = observable({ a: 2, b: 0 });
    const func = reactivable(() => {
      model.b = model.a * 2;
      return model.b;
    });
    strictEqual(func(), 4);
    model.a = 4;
    strictEqual(model.b, 8);
  });

  it("untrack", () => {
    const model = observable({ a: 2, b: 0 });
    const func = reactivable(() => {
      model.b = model.a * 2;
      return model.b;
    });
    strictEqual(func(), 4);
    untrack(() => (model.a = 4));
    strictEqual(model.b, 4);
  });
});
