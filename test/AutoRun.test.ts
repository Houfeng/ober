import { equal } from "assert";
import { autorun } from '../src/AutoRun';
import { observable } from '../src/Observable';

describe('AutoRun', () => {

  it('可响应的自执行函数', (done) => {
    const model = observable({ value: 1 });
    let tmp = 0;
    autorun(() => {
      tmp = tmp + 1;
      equal(model.value, tmp);
      if (tmp === 2) done();
    });
    model.value = 2;
  });

});