var QUnit = require('steal-qunit');
var ResolverObservable = require('./resolver');
var SimpleObservable = require('../can-simple-observable');
var mapEventMixin = require("can-event-queue/map/map");
var canSymbol = require("can-symbol");
var canReflect = require("can-reflect");
var Observation = require("can-observation");
var ObservationRecorder = require("can-observation-recorder");

QUnit.module('can-simple-observable/resolver');

QUnit.test("timer with teardown", function(){
    QUnit.stop();

    var CALLS = [];

    var obs = new ResolverObservable(function(value){
        CALLS.push("GENERATOR");
        var count = 0;
        value.resolve(count);
        var interval = setInterval(function(){
            CALLS.push("INTERVAL");
            value.resolve(++count);
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
var queues = require("can-queues");
QUnit.test('basics listenTo', 14, function(assert){
    var number = new SimpleObservable(1);

    var map = mapEventMixin({
        property: 1
    });

    var obs = new ResolverObservable(function testee(value){
        QUnit.equal( value.resolve(6), 6, "resolve returns passed value");


        value.listenTo(number, function(newNumber){
            assert.equal(newNumber,2, "got the new number");
            assert.equal(this, map, "listenTo this is the context");
            QUnit.equal( value.resolve(5), 5, "resolve returns passed value");
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
    queues.log("flush");
    number.set(2);

    assert.equal(obs.get(), 5, "got updated value");
    assert.equal(canReflect.getValue(obs), 5, "got updated value");
});

QUnit.test("setter", 6, function(){
    var state = new SimpleObservable("IL");

    var city = new ResolverObservable(function fullName(value){
        value.resolve(value.lastSet.get());

        value.listenTo(state,function(){
            value.resolve(null);
        });
        value.listenTo(value.lastSet, value.resolve);

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

QUnit.test("getValueDependencies and value dependencies", function(assert) {
	var number = new SimpleObservable(1);

	var map = mapEventMixin({
		property: 1
	});

	var obs = new ResolverObservable(function(value) {
		value.resolve(6);
		value.listenTo(number, function(newNumber) {
			assert.equal(newNumber, 2, "got the new number");
			assert.equal(this, map, "listenTo this is the context");
			value.resolve(5);
		});
	}, map);

	// unbound
	assert.equal(obs.get(), 6, "got unbound value");
	assert.notOk(canReflect.valueHasDependencies(obs));
	assert.equal(canReflect.getValueDependencies(obs), undefined);

	// bound
	canReflect.onValue(obs, function(newVal) {
		assert.equal(newVal, 5, "got the new value");
	});
	assert.ok(canReflect.valueHasDependencies(obs));
	assert.ok(canReflect.getValueDependencies(obs).valueDependencies.has(number));

	// reverse direction
	assert.ok(
		canReflect.getWhatIChange(number).derive.valueDependencies.has(obs)
	);
});

QUnit.test("getValueDependencies and key dependencies", function(assert) {
	var state = mapEventMixin({
		foo: "foo"
	});

	var map = mapEventMixin({
		property: 1
	});

	var obs = new ResolverObservable(function(value) {
		value.resolve("bar");
		value.listenTo(state, "foo", function(newVal) {
			value.resolve(newVal);
		});
	}, map);

	// unbound
	assert.notOk(canReflect.valueHasDependencies(obs));
	assert.equal(canReflect.getValueDependencies(obs), undefined);

	// bound
	canReflect.onValue(obs, function() {});
	assert.ok(canReflect.valueHasDependencies(obs));
	assert.ok(
		canReflect
			.getValueDependencies(obs)
			.keyDependencies.get(state)
			.has("foo")
	);

	// reverse direction
	assert.ok(
		canReflect.getWhatIChange(state, "foo").derive.valueDependencies.has(obs)
	);
});

QUnit.test("getWhatIChange", function(assert) {
	var number = new SimpleObservable(1);

	var map = mapEventMixin({
		property: 1
	});

	var dep = new ResolverObservable(function(value) {
		value.resolve(6);
		value.listenTo(number, function(newNumber) {
			value.resolve(newNumber);
		});
	}, map);

	var obs = new ResolverObservable(function(value) {
		value.resolve("foo");
		value.listenTo(dep, function(newVal) {
			value.resolve(newVal);
		});
	});

	// unbound
	assert.ok(canReflect.getWhatIChange(dep) === undefined);

	// bound
	canReflect.onValue(obs, function() {});
	assert.ok(canReflect.getWhatIChange(dep).derive.valueDependencies.has(obs));
});

QUnit.test("proactive binding doesn't last past binding (can-stache#486)", function(){
    var v = new SimpleObservable(2);

    var readCount = 0;

    var obs = new ResolverObservable(function(value) {
        value.listenTo(v, function(newVal) {
            readCount++;
			value.resolve(newVal);
		});
	});

    var outer = new Observation(function(){
        return obs.get();
    });

    function handler(){}

    outer.on(handler);

    outer.off(handler);

    v.set(3);

    QUnit.equal(readCount, 0, "internal observation only updated once");

});

QUnit.test("reading observables does not leak the observable read", function(){
    // if an observation is listening is reading this value, the value
    // should not ObservationRecorder.add its deps
    // there is a similar test in can-define

    var v = new SimpleObservable(2);

    var obs = new ResolverObservable(function(value) {
        value.resolve( canReflect.getValue(v));
	});

    ObservationRecorder.start();

    obs.on(function(){});

    var records = ObservationRecorder.stop();

    QUnit.equal(records.keyDependencies.size, 0, "there are no key dependencies");
    QUnit.equal(records.valueDependencies.size, 0, "there are no valueDependencies");
});
