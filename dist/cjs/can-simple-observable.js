/*can-simple-observable@1.0.0#can-simple-observable*/
var canReflect = require('can-reflect');
var canBatch = require('can-event/batch/batch');
var Observation = require('can-observation');
var CID = require('can-cid');
var ns = require('can-namespace');
module.exports = ns.simpleObservable = function simpleObservable(initialValue) {
    var value = initialValue;
    var handlers = [];
    var fn = function (newValue) {
        if (arguments.length) {
            value = newValue;
            handlers.forEach(function (handler) {
                canBatch.queue([
                    handler,
                    fn,
                    [newValue]
                ]);
            }, this);
        } else {
            Observation.add(fn);
            return value;
        }
    };
    CID(fn);
    canReflect.assignSymbols(fn, {
        'can.onValue': function (handler) {
            handlers.push(handler);
        },
        'can.offValue': function (handler) {
            var index = handlers.indexOf(handler);
            handlers.splice(index, 1);
        },
        'can.setValue': function (newValue) {
            return fn(newValue);
        },
        'can.getValue': function () {
            return fn();
        }
    });
    return fn;
};