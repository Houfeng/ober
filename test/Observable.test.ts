import "./mode";
import { strictEqual } from "assert";
import { observable } from '../src/Observable';
import { ObserveEvent, subscribe, unsubscribe } from '../src/ObserveBus';
import { ObserveData } from '../src/ObserveData';

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
    const Model = observable(class {
      value = 1;
    });
    const model = new Model();
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