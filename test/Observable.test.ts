import "./helpers/mode";

import { bind, isObservable, observable, spy } from "../src";
import { strictEqual } from "node:assert";
import { describe, it } from "node:test";

describe("Observable", () => {
  it("设置可观察对象", () => {
    return new Promise<void>((resolve) => {
      const model = observable({ value: 1 });
      strictEqual(model.value, 1);
      //eslint-disable-next-line
      let timer: any;
      spy.publish = (type, { member, value }) => {
        if (type !== "change") return;
        strictEqual(member, "value");
        strictEqual(value, 2);
        resolve();
        spy.publish = undefined;
        if (timer) clearTimeout(timer);
      };
      timer = setTimeout(() => {
        spy.publish = undefined;
        throw new Error("Timeout");
      }, 2000);
      model.value = 2;
    });
  });

  it("创建可观察类型", () => {
    return new Promise<void>((resolve) => {
      class OriginModel {
        static id = "M";
        value = 1;
      }
      const Model = observable(OriginModel);
      const model = new Model();
      strictEqual(Model.id, "M", "检查 ID");
      strictEqual(model instanceof Model, true, "model instanceof Model");
      strictEqual(
        model instanceof OriginModel,
        true,
        "model instanceof OriginModel",
      );
      const originModel = new OriginModel();
      strictEqual(
        originModel instanceof OriginModel,
        true,
        "originModel instanceof OriginModel",
      );
      strictEqual(model.value, 1);
      //eslint-disable-next-line
      let timer: any;
      spy.publish = (type, { member, value }) => {
        if (type !== "change") return;
        strictEqual(member, "value");
        strictEqual(value, 2);
        spy.publish = undefined;
        resolve();
        if (timer) clearTimeout(timer);
      };
      timer = setTimeout(() => {
        spy.publish = undefined;
        throw new Error("Timeout");
      }, 2000);
      model.value = 2;
    });
  });

  it("可观察 setter", () => {
    let proxy: boolean;
    const Demo = observable(
      class OriginDemo {
        a = 1;
        b = 2;
        set c(value: number) {
          this.a = value;
          this.b = value;
          proxy = isObservable(this);
        }
      },
    );
    const demo = new Demo();
    demo.c = 3;
    strictEqual(demo.a, 3);
    strictEqual(demo.b, 3);
    strictEqual(proxy!, true);
  });

  it("可观察 method", () => {
    let proxy: boolean;
    let instance: any;
    const A = observable(
      class InnerA {
        a = 1;
        b = 2;
        setC(value: number) {
          this.a = value;
          this.b = value;
          proxy = isObservable(this);
          //eslint-disable-next-line
          instance = this;
        }
      },
    );
    const B = observable(class InnerB extends A {});
    const C = observable(class InnerC extends B {});
    const x = new C();
    x.setC(3);
    strictEqual(x.a, 3);
    strictEqual(x.b, 3);
    strictEqual(proxy!, true);
    strictEqual(x === instance, true);
  });

  it("可观察特性子类不可继承", () => {
    const A = observable(
      class InnerA {
        name = "A";
        getA() {
          return "A";
        }
      },
    );
    class B extends A {
      age = 1;
      getB() {
        return "B";
      }
    }
    const C = observable(
      class InnerC extends B {
        age = 1;
      },
    );
    const a = new A();
    const b = new B();
    const c = new C();
    strictEqual(isObservable(A), true, "A 是可观察的");
    strictEqual(isObservable(a), true, "a 是可观察的");
    strictEqual(isObservable(B), false, "B 是不可观察的");
    strictEqual(isObservable(b), false, "b 是不可观察的");
    strictEqual(isObservable(C), true, "C 是可观察的");
    strictEqual(isObservable(c), true, "c 是可观察的");
    strictEqual(c.getA(), "A");
    strictEqual(c.getB(), "B");
  });

  it("正确序列化", () => {
    const A = observable(
      class InnerA {
        name = "A";
        age = 0;
        getA() {
          return "A";
        }
      },
    );
    const a = new A();
    a.age = 1;
    strictEqual(`{"name":"A","age":1}`, JSON.stringify(a));
  });

  it("绑定 this 的方法", () => {
    return new Promise<void>((resolve) => {
      const X = observable(
        class InnerX {
          name = "X";
          setX = bind(function (this: InnerX | void, value: string) {
            (this as any).name = value;
          });
        },
      );
      //eslint-disable-next-line
      let timer: any;
      const model = new X();
      spy.publish = (type, { member, value }) => {
        if (type != "change") return;
        strictEqual(member, "name");
        strictEqual(value, "XX");
        spy.publish = undefined;
        resolve();
        if (timer) clearTimeout(timer);
      };
      timer = setTimeout(() => {
        spy.publish = undefined;
        throw new Error("Timeout");
      }, 2000);
      const { setX } = model;
      strictEqual(setX, model.setX);
      setX("XX");
    });
  });
});
