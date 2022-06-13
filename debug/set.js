
const sleep = (wait) =>
  new Promise(resolve => setTimeout(resolve, wait));

function FastSet() {
  let first = null;
  let last = null;
  const map = Object.create(null);
  const has = (value) => !!map[value];
  const add = (value) => {
    const item = Object.create(null);
    // item.prev = last;
    // item.value = value;
    // // item.next = null;
    // if (!first) first = item;
    // if (last) last.next = item;
    // last = item;
    //map[value] = item;
  }
  const del = (value) => {
    if (!has(value)) return;
    const item = map[value];
    const prev = item.prev;
    const next = item.next;
    if (prev) prev.next = next;
    if (next) next.prev = prev;
    map[value] = void 0;
  }
  const each = (fn) => {
    let current = first;
    const end = last;
    while (!!current) {
      fn(current.value);
      if (current === end) break;
      current = current.next;
    }
  };
  return { has, add, del, each };
}

(async () => {

  await sleep(1000);

  const set = new Set();
  console.time('set');
  for (let i = 0; i <= 10000; i++) set.add(i);
  // set.forEach(value => {
  //   const a = value;
  // });
  console.timeEnd('set');

  await sleep(1000);

  const fastSet = FastSet();
  console.time('fastSet');
  for (let i = 0; i <= 10000; i++) fastSet.add(i);
  // fastSet.each(value => {
  //   const a = value;
  // });
  console.timeEnd('fastSet');


})();
