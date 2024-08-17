import { describe, it } from "node:test";
import { observable } from "../src";
import { watch } from "../src";
import { strictEqual } from "node:assert";

describe("Observable Array", () => {
  it("创建可观察的数组", () => {
    return new Promise<void>((resolve) => {
      const model = observable({ items: [1, 2, 3] });
      strictEqual(model.items[0], 1);
      watch(
        () => model.items[0],
        () => {
          strictEqual(model.items[0], 2);
          resolve();
        },
      );
      model.items[0] = 2;
    });
  });

  it("push", () => {
    return new Promise<void>((resolve) => {
      const model = observable({ items: [1, 2, 3] });
      strictEqual(model.items.join(","), "1,2,3");
      watch(
        () => model.items.length,
        () => {
          strictEqual(model.items.join(","), "1,2,3,4");
          resolve();
        },
      );
      model.items.push(4);
      strictEqual(model.items.join(","), "1,2,3,4");
    });
  });

  it("pop && push", () => {
    return new Promise<void>((resolve) => {
      const model = observable({ items: [1, 2, 3] });
      strictEqual(model.items.join(","), "1,2,3");
      model.items.pop();
      strictEqual(model.items.join(","), "1,2");
      watch(
        () => model.items.length,
        () => {
          strictEqual(model.items.join(","), "1,2,4");
          resolve();
        },
      );
      model.items.push(4);
      strictEqual(model.items.join(","), "1,2,4");
    });
  });

  it("pop", () => {
    return new Promise<void>((resolve) => {
      const model = observable({ items: [1, 2, 3] });
      strictEqual(model.items.join(","), "1,2,3");
      watch(
        () => model.items.length,
        () => {
          strictEqual(model.items.join(","), "1,2");
          resolve();
        },
      );
      model.items.pop();
      strictEqual(model.items.length, 2);
    });
  });

  it("unshift", () => {
    return new Promise<void>((resolve) => {
      const model = observable({ items: [1, 2, 3] });
      watch(
        () => model.items.length,
        () => {
          strictEqual(model.items.join(","), "0,1,2,3");
          resolve();
        },
      );
      //subscribe(ObserveEvent.set, (...args) => console.log("set", ...args));
      model.items.unshift(0);
      strictEqual(model.items.join(","), "0,1,2,3");
    });
  });

  it("shift", () => {
    return new Promise<void>((resolve) => {
      const model = observable({ items: [1, 2, 3] });
      watch(
        () => model.items.length,
        () => {
          strictEqual(model.items.join(","), "2,3");
          resolve();
        },
      );
      const item = model.items.shift();
      strictEqual(item, 1);
    });
  });

  it("splice remove", () => {
    return new Promise<void>((resolve) => {
      const model = observable({ items: [1, 2, 3] });
      watch(
        () => model.items.length,
        () => {
          strictEqual(model.items.join(","), "1,3");
          resolve();
        },
      );
      const items = model.items.splice(1, 1);
      strictEqual(items.join(","), "2");
    });
  });

  it("splice replace", () => {
    return new Promise<void>((resolve) => {
      const model = observable({ items: [1, 2, 3] });
      watch(
        () => model.items.length,
        () => {
          strictEqual(model.items.join(","), "1,4,3,2");
          resolve();
        },
      );
      const items = model.items.splice(1, 1, 4);
      strictEqual(items.join(","), "2");
      model.items.push(2);
    });
  });

  it("splice insert", () => {
    return new Promise<void>((resolve) => {
      const model = observable({ items: [1, 2, 3] });
      watch(
        () => model.items.length,
        () => {
          strictEqual(model.items.join(","), "1,4,2,3");
          resolve();
        },
      );
      model.items.splice(1, 0, 4);
    });
  });

  it("splice : remove & insert #1", () => {
    return new Promise<void>((resolve) => {
      const model = observable({ items: [1, 2, 3] });
      model.items.splice(1, 1);
      strictEqual(model.items.length, 2);
      watch(
        () => model.items.length,
        () => {
          strictEqual(model.items.join(","), "1,3,4");
          resolve();
        },
      );
      model.items.push(4);
      strictEqual(model.items.length, 3);
    });
  });

  it("splice : remove & insert #2", () => {
    return new Promise<void>((resolve) => {
      const model = observable({ items: [{ v: 1 }, { v: 2 }, { v: 3 }] });
      strictEqual('[{"v":1},{"v":2},{"v":3}]', JSON.stringify(model.items));
      const items = model.items.splice(1, 1);
      strictEqual('[{"v":1},{"v":3}]', JSON.stringify(model.items));
      watch(
        () => model.items.length,
        () => {
          strictEqual('[{"v":1},{"v":3},{"v":2}]', JSON.stringify(model.items));
          resolve();
        },
      );
      model.items.push(...items);
    });
  });

  it("reverse", () => {
    return new Promise<void>((resolve) => {
      const model = observable({ items: [1, 2, 3] });
      strictEqual(model.items.join(","), "1,2,3");
      watch(
        () => model.items.length,
        () => {
          strictEqual(model.items.join(","), "3,2,1,0");
          resolve();
        },
      );
      model.items.reverse();
      model.items.push(0);
    });
  });
});
