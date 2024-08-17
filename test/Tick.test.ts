import "./helpers/mode";

import { nextTick } from "../src";
import { strictEqual } from "node:assert";
import { describe, it } from "node:test";

describe("Tick", () => {
  it("异步执行", () => {
    return new Promise<void>((resolve) => {
      let value = 0;
      setTimeout(() => {
        value++;
        strictEqual(value, 4);
        resolve();
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
});
