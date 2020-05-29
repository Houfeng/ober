import { equal } from "assert";
import { observable } from '../src/Observable';
import { subscribe, unsubscribe } from '../src/ObserveBus';
import { ObserveData } from '../src/ObserveData';

describe('Observable', () => {

  it('设置可观察对象', (done) => {
    const model = observable({ value: 1 });
    equal(model.value, 1);
    const onSet = ({ member, value }: ObserveData) => {
      equal(member, "value");
      equal(value, 2);
      unsubscribe("set", onSet);
      done();
    };
    subscribe("set", onSet);
    model.value = 2;
  });

  it('创建可观察类型', (done) => {
    const Model = observable(class {
      value = 1;
    });
    const model = new Model();
    equal(model.value, 1);
    const onSet = ({ member, value }: ObserveData) => {
      equal(member, "value");
      equal(value, 2);
      unsubscribe("set", onSet);
      done();
    };
    subscribe("set", onSet);
    model.value = 2;
  });

});