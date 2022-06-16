
const sleep = (wait) =>
  new Promise(resolve => setTimeout(resolve, wait));

(async () => {

  console.time('new');

  const set = new Set();
  for (let i = 0; i <= 10000; i++) {
    set.add(i);
  }
  console.timeEnd('new');

  console.time('array');
  const list = [];
  const map = {};
  for (let i = 0; i <= 10000; i++) {
    if (!map[i]) {
      list.push(i);
      map[i] = true;
    }
  }
  // const l=new Set(list);
  console.timeEnd('array');

})();
