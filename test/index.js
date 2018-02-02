const Observer = require('../lib/observer');
const obj = { name: 'bob', age: 20 };
const ob = new Observer(obj);
ob.run(() => {
  console.log('run', obj.age);
});
obj.age = 30;
