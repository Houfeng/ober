import "./helpers/mode";

import { observable } from '../src/ObserveHof';
import { strictEqual } from "assert";
import { watch } from '../src/ObserveReactive';

describe('Watch', () => {

  it('监听数据的变化', (done) => {
    const model = observable({ value: 1 });
    watch(() => model.value, () => {
      strictEqual(model.value, 2);
      done();
    });
    model.value = 2;
  });

  it('监听数据的变化(浅对比)', (done) => {
    const model = observable({ value: { a: 1, b: 2 } });
    watch(() => model.value, () => {
      strictEqual(model.value.a, 2);
      done();
    });
    model.value.a = 2;
  });

});