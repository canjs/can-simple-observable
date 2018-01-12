var QUnit = require('steal-qunit');
var ResolverObservable = require('./resolver');
var SimpleObservable = require('../can-simple-observable');
var mapEventMixin = require("can-event-queue/map/map");
var canSymbol = require("can-symbol");
var canReflect = require("can-reflect");
var queues = require("can-queues");

QUnit.module('can-simple-observable/resolver');

QUnit.test("timer with teardown", function(){
    QUnit.stop();

    var CALLS = [];

    var obs = new ResolverObservable(function(resolve){
        CALLS.push("GENERATOR");
        var count = 0;
        resolve(count);
        var interval = setInterval(function(){
            CALLS.push("INTERVAL");
            resolve(++count);
        },10);

        return function(){
            CALLS.push("TEARDOWN");
            clearInterval(interval);
        };
    }, {});

    QUnit.equal( obs.get(), 0, "got initial value unbound");
    QUnit.deepEqual(CALLS,["GENERATOR","TEARDOWN"], "initial unbound read");
    CALLS = [];

    var handler = function(newVal){
        QUnit.equal( newVal, 1, "got first emitted value");
        QUnit.equal( obs.get(), 1, "got first emitted value");
        QUnit.deepEqual(CALLS,["INTERVAL"], "emitted value");
        CALLS = [];
        obs.off(handler);
        QUnit.deepEqual(CALLS,["TEARDOWN"], "emitted value");
        QUnit.start();
    };

    obs.on(handler);
    QUnit.equal( obs.get(), 0, "got initial value after bind");
    QUnit.deepEqual(CALLS,["GENERATOR"], "initial bind");
    CALLS = [];

});

QUnit.test('basics listenTo', 10, function(assert){
    var number = new SimpleObservable(1);

    var map = mapEventMixin({
        property: 1
    });

    var obs = new ResolverObservable(function(resolve, listenTo){
        resolve(6);


        listenTo(number, function(newNumber){
            assert.equal(newNumber,2, "got the new number");
            assert.equal(this, map, "listenTo this is the context");
            resolve(5);
        });

    }, map);

    assert.equal(obs.get(), 6, "got unbound value");
    assert.equal(canReflect.getValue(obs), 6, "got unbound value");
    var listenHandlers = obs.binder[ canSymbol.for("can.meta") ].listenHandlers;
    QUnit.equal(listenHandlers.size(), 0, "0 handlers after read");

    obs.on(function(newVal){
        QUnit.equal(newVal, 5, "got the new value");
    });
    assert.equal(obs.get(), 6, "got unbound value");
    listenHandlers = obs.binder[ canSymbol.for("can.meta") ].listenHandlers;
    QUnit.equal(listenHandlers.size(), 1, "1 handlers after bind");

    number.set(2);

    assert.equal(obs.get(), 5, "got updated value");
    assert.equal(canReflect.getValue(obs), 5, "got updated value");
});

QUnit.test("setter", 6, function(){
    var state = new SimpleObservable("IL");

    var city = new ResolverObservable(function fullName(resolve, listen, mute, lastSet){
        resolve(lastSet.get());

        listen(state,function(){
            resolve(null);
        });
        listen(lastSet, resolve);

    }, mapEventMixin({}) );

    city.set("Chicago");
    QUnit.equal(city.get(), "Chicago", "got unbound value");

    city.set("Rockford");
    QUnit.equal(city.get(), "Rockford", "got unbound value after another set");

    var CITIES = [];
    city.on(function(city){
        CITIES.push(city);
    });

    QUnit.equal(city.get(), "Rockford", "got bound value after binding");

    state.set("CA");

    QUnit.equal(city.get(), null, "updated city after state set");

    city.set("San Jose");

    QUnit.equal(city.get(), "San Jose", "updated city after state set");

    QUnit.deepEqual(CITIES,[null,"San Jose"], "events right");
});
