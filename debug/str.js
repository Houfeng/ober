
const sleep = (wait) =>
  new Promise(resolve => setTimeout(resolve, wait));

(async () => {

  await sleep(1000);

  const str = '123456';
  console.time('slice');
  for (let i = 0; i <= 100000; i++) {
    str.slice(0, 2) === '12';
  };
  console.timeEnd('slice');

  await sleep(1000);

  console.time('startsWith');
  for (let i = 0; i <= 100000; i++) {
    str.startsWith('12');
  };
  console.timeEnd('startsWith');

})();
