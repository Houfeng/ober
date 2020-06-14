import { observable, watch } from "../src";
//import { ObserveConfig } from '../src/ObserveConfig';
//import { action } from "../src/ObserveAction";

// const demo = observable({ msg: 'a', num: 1 });
// autorun(() => {
//   console.log('num', demo.num);
//   console.log('msg', demo.msg);
//   demo.num = 2;
// });

//ObserveConfig.strict = true;

const model = observable({ items: [{ v: 1 }, { v: 2 }, { v: 3 }] });
console.log("#0:", JSON.stringify(model.items));
const items = model.items.splice(1, 1);
console.log("#1:", JSON.stringify(model.items));
watch(() => model.items.length, () => {
  console.log("#2:", JSON.stringify(model.items));
});
model.items.push({ v: 4 });
model.items.splice(2, 0, ...items);
