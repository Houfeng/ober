import { equal } from "assert";
import { observable } from '../src/Observable';
import { watch } from '../src/Watch';

describe.skip('Observable Array', () => {

  it('创建可观察的数组', (done) => {
    const model = observable({ items: [1, 2, 3] });
    equal(model.items[0], 1);
    watch(() => model.items[0], () => {
      equal(model.items[0], 2);
      done();
    });
    model.items[0] = 2;
  });

  it('push', (done) => {
    const model = observable({ items: [1, 2, 3] });
    watch(() => model.items.length, () => {
      equal(model.items.join(','), '1,2,3,4');
      done();
    });
    model.items.push(4);
    equal(model.items.length, 4);
  });

  it('pop && push', (done) => {
    const model = observable({ items: [1, 2, 3] });
    model.items.pop();
    equal(model.items.length, 2);
    watch(() => model.items.length, () => {
      equal(model.items.join(','), '1,2,4');
      done();
    });
    model.items.push(4);
    equal(model.items.length, 3);
  });

  it('pop', (done) => {
    const model = observable({ items: [1, 2, 3] });
    watch(() => model.items, () => {
      equal(model.items.join(','), '1,2');
      done();
    });
    model.items.pop();
    equal(model.items.length, 2);
  });

  it('unshift', (done) => {
    const model = observable({ items: [1, 2, 3] });
    watch(() => model.items, () => {
      equal(model.items.join(','), '0,1,2,3');
      done();
    });
    model.items.unshift(0);
    equal(model.items.length, 4);
  });

  it('shift', (done) => {
    const model = observable({ items: [1, 2, 3] });
    watch(() => model.items, () => {
      equal(model.items.join(','), '2,3');
      done();
    });
    const item = model.items.shift();
    equal(item, 1);
  });

  it('splice remove', (done) => {
    const model = observable({ items: [1, 2, 3] });
    watch(() => model.items, () => {
      equal(model.items.join(','), '1,3');
      done();
    });
    const items = model.items.splice(1, 1);
    equal(items.join(','), 2);
  });

  it('splice replace', (done) => {
    const model = observable({ items: [1, 2, 3] });
    watch(() => model.items, () => {
      equal(model.items.join(','), '1,4,3');
      done();
    });
    const items = model.items.splice(1, 1, 4);
    equal(items.join(','), 2);
  });

  it('splice insert', (done) => {
    const model = observable({ items: [1, 2, 3] });
    watch(() => model.items, () => {
      equal(model.items.join(','), '1,4,2,3');
      done();
    });
    model.items.splice(1, 0, 4);
  });

  it('splice : remove & insert #1', (done) => {
    const model = observable({ items: [1, 2, 3] });
    model.items.splice(1, 1);
    equal(model.items.length, 2);
    watch(() => model.items.length, () => {
      equal(model.items.join(','), '1,3,4');
      done();
    });
    model.items.push(4);
    equal(model.items.length, 3);
  });

  it('splice : remove & insert #2', (done) => {
    const model = observable({ items: [{ v: 1 }, { v: 2 }, { v: 3 }] });
    equal('[{"v":1},{"v":2},{"v":3}]', JSON.stringify(model.items));
    const items = model.items.splice(1, 1);
    equal('[{"v":1},{"v":3}]', JSON.stringify(model.items));
    watch(() => model.items.length, () => {
      equal('[{"v":1},{"v":3},{"v":2}]', JSON.stringify(model.items));
      done();
    });
    model.items.push(...items);
  });

  it('reverse', (done) => {
    const model = observable({ items: [1, 2, 3] });
    watch(() => model.items, () => {
      equal(model.items.join(','), '3,2,1');
      done();
    });
    model.items.reverse()
  });

});