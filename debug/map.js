
const sleep = (wait) =>
  new Promise(resolve => setTimeout(resolve, wait));

(async () => {

  await sleep(1000);

  const obj = {};
  console.time('obj');
  for (let i = 0; i <= 10000; i++) obj[i] = i;
  console.timeEnd('obj');

  await sleep(1000);

  const map = new Map();
  console.time('map');
  for (let i = 0; i <= 10000; i++) map.set(i, i);
  console.timeEnd('map');

})();
