import { ObserveConfig, ObserveEvent, ObserveMode, ObserveState, isProxy, observable, subscribe } from "../src";
//import { ObserveConfig } from '../src/ObserveConfig';
//import { action } from "../src/ObserveAction";

// const demo = observable({ msg: 'a', num: 1 });
// autorun(() => {
//   console.log('num', demo.num);
//   console.log('msg', demo.msg);
//   demo.num = 2;
// });

//ObserveConfig.strict = true;

ObserveState.get = true;
ObserveConfig.mode = ObserveMode.proxy;

subscribe(ObserveEvent.get, info => console.log("GET", info));
subscribe(ObserveEvent.set, info => console.log("SET", info));

// const model = observable({ items: [{ v: 1 }, { v: 2 }, { v: 3 }] });
// console.log("#0:", JSON.stringify(model.items));
// const items = model.items.splice(1, 1);
// console.log("#1:", JSON.stringify(model.items));
// watch(() => model.items.length, () => {
//   console.log("#2:", JSON.stringify(model.items));
// });
// model.items.push({ v: 4 });
// model.items.splice(2, 0, ...items);

// //@ts-ignore
// model.xxx = 1;

// const originModel = {
//   _name: "test",
//   get name() {
//     console.log("getter");
//     return this._name;
//   },
//   set name(value: string) {
//     console.log("setter");
//     this._name = value;
//   }
// };
// originModel.name = '1';

// const model = observable(originModel);
// console.log("name", model.name);
// model.name = '2';
// console.log("name", model.name);

const A = observable(class AInner {
  name = "<name>";
  // say() {
  //   console.log('a')
  // }
})

// class B extends A {
//   age = 1;
// }

const B = observable(class BInner extends A {
  age = 1;
  say() {
    console.log('b')
  }
})

const C = observable(class CInner extends B {
  age = 2;
})

const a = new A();
const b = new B();
const c = new C();

console.log("A", isProxy(A))
console.log("a", isProxy(a))

console.log("B", isProxy(B))
console.log("b", isProxy(b))

console.log("C", isProxy(C))
console.log("c", isProxy(c))

console.log("A.prototype", A.prototype);
console.log("B.prototype", B.prototype);
console.log("C.prototype", C.prototype);
console.log("=====================");
// console.log(Object.getPrototypeOf(b) === B.prototype);
console.log('b constructor', b.constructor, B);
console.log(b.constructor === B);
console.log(b instanceof B);
console.log(b instanceof A);
console.log(c instanceof C);
console.log(c instanceof B);
console.log(c instanceof A);

console.log("=====================");
console.log(c, c.name);