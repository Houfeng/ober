import { ObserveConfig, observable, reactivable } from "../src";

ObserveConfig.mode = "proxy";

const model = observable({ a: 1, b: 2 });
const func = reactivable((num: number) => {
  console.log('+++++++', 'num', num, 'model.a', model.a)
  return model.a + num;
});
console.log('++++++++++++', 'model.a', model.a, func(1))