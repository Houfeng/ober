import "./helpers/mode";

import { observable } from '../src/ObserveHof';
import { strictEqual } from "assert";
import { watch } from '../src/ObserveReactive';

describe('Observable Array', () => {

  it('创建可观察的数组', (done) => {
    const model = observable({ items: [1, 2, 3] });
    strictEqual(model.items[0], 1);
    watch(() => model.items[0], () => {
      strictEqual(model.items[0], 2);
      done();
    });
    model.items[0] = 2;
  });

  it('push', (done) => {
    const model = observable({ items: [1, 2, 3] });
    strictEqual(model.items.join(','), '1,2,3');
    watch(() => model.items.length, () => {
      strictEqual(model.items.join(','), '1,2,3,4');
      done();
    });
    model.items.push(4);
    strictEqual(model.items.join(','), '1,2,3,4');
  });

  it('pop && push', (done) => {
    const model = observable({ items: [1, 2, 3] });
    strictEqual(model.items.join(','), '1,2,3');
    model.items.pop();
    strictEqual(model.items.join(','), '1,2');
    watch(() => model.items.length, () => {
      strictEqual(model.items.join(','), '1,2,4');
      done();
    });
    model.items.push(4);
    strictEqual(model.items.join(','), '1,2,4');
  });

  it('pop', (done) => {
    const model = observable({ items: [1, 2, 3] });
    strictEqual(model.items.join(','), '1,2,3');
    watch(() => model.items.length, () => {
      strictEqual(model.items.join(','), '1,2');
      done();
    });
    model.items.pop();
    strictEqual(model.items.length, 2);
  });

  it('unshift', (done) => {
    const model = observable({ items: [1, 2, 3] });
    watch(() => model.items.length, () => {
      strictEqual(model.items.join(','), '0,1,2,3');
      done();
    });
    //subscribe(ObserveEvent.set, (...args) => console.log("set", ...args));
    model.items.unshift(0);
    strictEqual(model.items.join(','), '0,1,2,3');
  });

  it('shift', (done) => {
    const model = observable({ items: [1, 2, 3] });
    watch(() => model.items.length, () => {
      strictEqual(model.items.join(','), '2,3');
      done();
    });
    const item = model.items.shift();
    strictEqual(item, 1);
  });

  it('splice remove', (done) => {
    const model = observable({ items: [1, 2, 3] });
    watch(() => model.items.length, () => {
      strictEqual(model.items.join(','), '1,3');
      done();
    });
    const items = model.items.splice(1, 1);
    strictEqual(items.join(','), '2');
  });

  it('splice replace', (done) => {
    const model = observable({ items: [1, 2, 3] });
    watch(() => model.items.length, () => {
      strictEqual(model.items.join(','), '1,4,3,2');
      done();
    });
    const items = model.items.splice(1, 1, 4);
    strictEqual(items.join(','), '2');
    model.items.push(2);
  });

  it('splice insert', (done) => {
    const model = observable({ items: [1, 2, 3] });
    watch(() => model.items.length, () => {
      strictEqual(model.items.join(','), '1,4,2,3');
      done();
    });
    model.items.splice(1, 0, 4);
  });

  it('splice : remove & insert #1', (done) => {
    const model = observable({ items: [1, 2, 3] });
    model.items.splice(1, 1);
    strictEqual(model.items.length, 2);
    watch(() => model.items.length, () => {
      strictEqual(model.items.join(','), '1,3,4');
      done();
    });
    model.items.push(4);
    strictEqual(model.items.length, 3);
  });

  it('splice : remove & insert #2', (done) => {
    const model = observable({ items: [{ v: 1 }, { v: 2 }, { v: 3 }] });
    strictEqual('[{"v":1},{"v":2},{"v":3}]', JSON.stringify(model.items));
    const items = model.items.splice(1, 1);
    strictEqual('[{"v":1},{"v":3}]', JSON.stringify(model.items));
    watch(() => model.items.length, () => {
      strictEqual('[{"v":1},{"v":3},{"v":2}]', JSON.stringify(model.items));
      done();
    });
    model.items.push(...items);
  });

  it('reverse', (done) => {
    const model = observable({ items: [1, 2, 3] });
    strictEqual(model.items.join(','), '1,2,3');
    watch(() => model.items.length, () => {
      strictEqual(model.items.join(','), '3,2,1,0');
      done();
    });
    model.items.reverse();
    model.items.push(0);
  });

});