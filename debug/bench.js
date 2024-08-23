console.time('time');
let result

let r = /^__/;
for (let i = 0; i < 100000; i++) {
  // result = `__${i}`.indexOf('__') === 0;
  // result = `__${i}`.startsWith('__');
  result = r.test(`__${i}`)
}

console.timeEnd('time');