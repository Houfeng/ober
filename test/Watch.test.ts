import "./helpers/mode";

import { strictEqual } from "node:assert";
import { describe, it } from "node:test";
import { observable } from "../src";
import { watch } from "../src";

describe("Watch", () => {
  it("监听数据的变化", () => {
    return new Promise<void>((resolve) => {
      const model = observable({ value: 1 });
      watch(
        () => model.value,
        () => {
          strictEqual(model.value, 2);
          resolve();
        },
      );
      model.value = 2;
    });
  });

  it("监听数据的变化(浅对比)", () => {
    return new Promise<void>((resolve) => {
      const model = observable({ value: { a: 1, b: 2 } });
      watch(
        () => model.value,
        () => {
          strictEqual(model.value.a, 2);
          resolve();
        },
      );
      model.value.a = 2;
    });
  });
});
