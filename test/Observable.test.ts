import "./mode";

import { ObserveEvent, subscribe, unsubscribe } from '../src/ObserveBus';
import { ObserveReflect, isProxy } from "../src";

import { ObserveData } from '../src/ObserveData';
import { observable } from '../src/Observable';
import { strictEqual } from "assert";

describe('Observable', () => {

  it('设置可观察对象', (done) => {
    const model = observable({ value: 1 });
    strictEqual(model.value, 1);
    const onSet = ({ member, value }: ObserveData) => {
      strictEqual(member, "value");
      strictEqual(value, 2);
      unsubscribe(ObserveEvent.set, onSet);
      done();
    };
    subscribe(ObserveEvent.set, onSet);
    model.value = 2;
  });

  it('创建可观察类型', (done) => {
    class OriginModel {
      static id = "M";
      value = 1;
    }
    const Model = observable(OriginModel);
    const model = new Model();
    strictEqual(Model.id, "M");
    strictEqual(model instanceof Model, true);
    strictEqual(model instanceof OriginModel, true);
    const originModel = new OriginModel();
    strictEqual(originModel instanceof Model, true);
    strictEqual(model.value, 1);
    const onSet = ({ member, value }: ObserveData) => {
      strictEqual(member, "value");
      strictEqual(value, 2);
      unsubscribe(ObserveEvent.set, onSet);
      done();
    };
    subscribe(ObserveEvent.set, onSet);
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
    strictEqual(proxy, ObserveReflect.isProxyMode());
    done();
  });

  it("可观察 method", (done) => {
    let proxy: boolean;
    const Demo = observable(class OriginDemo {
      a = 1;
      b = 2;
      setC(value: number) {
        this.a = value;
        this.b = value;
        proxy = isProxy(this);
      }
    });
    const demo = new Demo();
    demo.setC(3);
    strictEqual(demo.a, 3);
    strictEqual(demo.b, 3);
    strictEqual(proxy, ObserveReflect.isProxyMode());
    done();
  });

});