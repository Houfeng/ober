import "./helpers/mode";

import { bind, observable } from '../src/ObserveHof';

import { ObserveSpy } from "../src";
import { isProxy } from "../src/ObserveUtil";
import { strictEqual } from "assert";

describe('Observable', () => {

  it('设置可观察对象', (done) => {
    const model = observable({ value: 1 });
    strictEqual(model.value, 1);
    let timer: any;
    ObserveSpy.publish = (type, { member, value }) => {
      if (type !== 'change') return;
      strictEqual(member, "value");
      strictEqual(value, 2);
      done();
      ObserveSpy.publish = undefined;
      if (timer) clearTimeout(timer);
    };
    timer = setTimeout(() => {
      ObserveSpy.publish = undefined;
      throw new Error('Timeout');
    }, 2000);
    model.value = 2;
  });

  it('创建可观察类型', (done) => {
    class OriginModel {
      static id = "M";
      value = 1;
    }
    const Model = observable(OriginModel);
    const model = new Model();
    strictEqual(Model.id, "M", "检查 ID");
    strictEqual(model instanceof Model, true);
    strictEqual(model instanceof OriginModel, true);
    const originModel = new OriginModel();
    strictEqual(originModel instanceof OriginModel, true);
    strictEqual(model.value, 1);
    let timer: any;
    ObserveSpy.publish = (type, { member, value }) => {
      if (type !== 'change') return;
      strictEqual(member, "value");
      strictEqual(value, 2);
      ObserveSpy.publish = undefined;
      done();
      if (timer) clearTimeout(timer);
    };
    timer = setTimeout(() => {
      ObserveSpy.publish = undefined;
      throw new Error('Timeout');
    }, 2000);
    model.value = 2;
  });

  it("可观察 setter", (done) => {
    let proxy: boolean;
    const Demo = observable(class OriginDemo {
      a = 1;
      b = 2;
      set c(value: number) {
        this.a = value;
        this.b = value;
        proxy = isProxy(this);
      }
    });
    const demo = new Demo();
    demo.c = 3;
    strictEqual(demo.a, 3);
    strictEqual(demo.b, 3);
    strictEqual(proxy!, true);
    done();
  });

  it("可观察 method", (done) => {
    let proxy: boolean;
    let instance: any;
    const A = observable(class InnerA {
      a = 1;
      b = 2;
      setC(value: number) {
        this.a = value;
        this.b = value;
        proxy = isProxy(this);
        instance = this;
      }
    });
    const B = observable(class InnerB extends A {
    });
    const C = observable(class InnerC extends B {
    });
    const x = new C();
    x.setC(3);
    strictEqual(x.a, 3);
    strictEqual(x.b, 3);
    strictEqual(proxy!, true);
    strictEqual(x === instance, true);
    done();
  });

  it('可观察特性子类不可继承', (done) => {
    const A = observable(class InnerA {
      name = "A";
      getA() {
        return "A";
      }
    })
    class B extends A {
      age = 1;
      getB() {
        return "B";
      }
    }
    const C = observable(class InnerC extends B {
      age = 1;
    })
    const a = new A();
    const b = new B();
    const c = new C();
    strictEqual(isProxy(A), true, "A 是可观察的");
    strictEqual(isProxy(a), true, "a 是可观察的");
    strictEqual(isProxy(B), false, "B 是不可观察的");
    strictEqual(isProxy(b), false, "b 是不可观察的");
    strictEqual(isProxy(C), true, "C 是可观察的");
    strictEqual(isProxy(c), true, "c 是可观察的");
    strictEqual(c.getA(), "A");
    strictEqual(c.getB(), "B");
    done();
  });

  it("正确序列化", (done) => {
    const A = observable(class InnerA {
      name = "A";
      age = 0;
      getA() {
        return "A";
      }
    });
    const a = new A();
    a.age = 1;
    strictEqual(`{"name":"A","age":1}`, JSON.stringify(a));
    done();
  })

  it.skip("绑定 this 的方法", (done) => {
    const X = observable(class InnerX {
      name = "X";
      setX = bind(function (this: InnerX | void, value: string) {
        this!.name = value;
      })
    });
    let timer: any
    const model = new X();
    ObserveSpy.publish = (type, { member, value }) => {
      if (type != "change") return;
      strictEqual(member, "name");
      strictEqual(value, "XX");
      ObserveSpy.publish = undefined;
      done();
      if (timer) clearTimeout(timer);
    };
    timer = setTimeout(() => {
      ObserveSpy.publish = undefined;
      throw new Error('Timeout');
    }, 2000);
    const { setX } = model;
    strictEqual(setX, model.setX);
    setX("XX");
  })

});