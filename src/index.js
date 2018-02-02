const Observer = require('./observer');
const AutoRun = require('./autorun');
const Watcher = require('./watcher');
const nextTick = require('./next-tick');

Observer.AutoRun = AutoRun;
Observer.Watcher = Watcher;
Observer.nextTick = nextTick;

module.exports = Observer;