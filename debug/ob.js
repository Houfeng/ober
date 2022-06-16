const { observable } = require('../dist/cjs');

const sleep = (wait) =>
  new Promise(resolve => setTimeout(resolve, wait));

(async () => {

  await sleep(1000);
  const times = 10000;

  const p = { value: 1 };
  console.time('p');
  for (let i = 0; i <= times; i++) {
    let v = p.value;
  }
  console.timeEnd('p');

  await sleep(1000);

  const o = observable({ value: 1 });
  console.time('o');
  for (let i = 0; i <= times; i++) {
    let v = o.value;
  }
  console.timeEnd('o');

})();
