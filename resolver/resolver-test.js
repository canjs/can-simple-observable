var QUnit = require('steal-qunit');
var ResolverObservable = require('./resolver');
var SimpleObservable = require('../can-simple-observable');
var mapEventMixin = require("can-event-queue/map/map");

QUnit.module('can-simple-observable/async');

QUnit.test('basics', 5, function(assert){
    var number = new SimpleObservable(1);

    var map = mapEventMixin({
        property: 1
    });
    var calls = [];
    var obs = new ResolverObservable(function(resolve, listenTo){

        calls.push([!!resolve, !!listenTo]);

        if(listenTo) {
            listenTo(number, function(newNumber){
                assert.equal(newNumber,2, "got the new number");
                assert.equal(this, map, "listenTo this is the context");
                resolve(5);
            });
        }
        return 6;
    }, map);

    assert.equal(obs.get(), 6, "got unbound value");

    obs.on(function(newVal){
        QUnit.equal(newVal, 5, "got the new value");
    });

    number.set(2);

    QUnit.deepEqual(calls,[
        [false, false],
        [true, true]
    ], "called with the right arguments");
});
