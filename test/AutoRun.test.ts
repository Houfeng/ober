import "./helpers/mode";

import { autorun } from "../src";
import { observable } from "../src";
import { strictEqual } from "node:assert";
import { describe, it } from "node:test";

describe("AutoRun", () => {
  it("可响应的自执行函数", () => {
    return new Promise<void>((resolve) => {
      const model = observable({ value: 1 });
      let tmp = 0;
      autorun(() => {
        tmp = tmp + 1;
        strictEqual(model.value, tmp);
        if (tmp === 2) resolve();
      });
      model.value = 2;
    });
  });
});
