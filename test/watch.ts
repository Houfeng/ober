import { equal } from "assert";
import { watch } from '../src/Watch';
import { observable } from '../src/Observable';

describe('watch', () => {

  it('监听数据的变化', (done) => {
    const model = observable({ value: 1 });
    watch(() => model.value, () => {
      equal(model.value, 2);
      done();
    });
    model.value = 2;
  });

});