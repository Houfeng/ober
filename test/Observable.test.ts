import "./mode";

import { ObserveEvent, subscribe, unsubscribe } from '../src/ObserveBus';

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


});