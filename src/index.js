const Observer = require('./observer');
const AutoRun = require('./autorun');
const Watcher = require('./watcher');
const expression = require('./expression');
const nextTick = require('./next-tick');

Observer.AutoRun = AutoRun;
Observer.Watcher = Watcher;
Observer.expression = expression;
Observer.nextTick = nextTick;
Observer.Observer = Observer;

module.exports = Observer;