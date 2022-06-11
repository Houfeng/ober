import "./helpers/mode";

import { autorun } from '../src/ObserveReactive';
import { observable } from '../src/ObserveHof';
import { strictEqual } from "assert";

describe('AutoRun', () => {

  it('可响应的自执行函数', (done) => {
    const model = observable({ value: 1 });
    let tmp = 0;
    autorun(() => {
      tmp = tmp + 1;
      strictEqual(model.value, tmp);
      if (tmp === 2) done();
    });
    model.value = 2;
  });

});