var QUnit = require('steal-qunit');
var SettableObservable = require('./settable');
var SimpleObservable = require('../can-simple-observable');
var canReflect = require('can-reflect');

QUnit.module('can-simple-observable/settable');

QUnit.test('basics', function(){

    var value = new SimpleObservable(2);


    var obs = new SettableObservable(function(lastSet){
        return lastSet * value.get();
    }, null, 1);

    // Unbound and unobserved behavior
    QUnit.equal(canReflect.getValue(obs), 2, 'getValue unbound');



    var changes = 0;
    var handler = function(newValue) {
        changes++;
        if(changes === 1) {
            QUnit.equal(newValue, 4, 'set observable');
            obs.set(3);
        } else if(changes === 2){
            QUnit.equal(newValue, 6, 'set observable in handler');
            value.set(3);
        } else {
            QUnit.equal(newValue, 9, 'set source');
        }
    };
    canReflect.onValue(obs, handler);
    canReflect.setValue(obs, 2);

    QUnit.equal( canReflect.getValue(obs), 9, "after bound");
    canReflect.offValue(obs, handler);
    canReflect.setValue(obs, 5);
    QUnit.equal( canReflect.getValue(obs), 15, "after unbound");

});

QUnit.test("get and set Priority", function(){
    var value = new SimpleObservable(2);


    var obs = new SettableObservable(function(lastSet){
        return lastSet * value.get();
    }, null, 1);

    canReflect.setPriority(obs, 5);


    QUnit.equal(canReflect.getPriority(obs), 5, "set priority");
});

QUnit.test("log observable changes", function(assert) {
	var done = assert.async();

	var obs = new SettableObservable(function(lastSet) {
		return lastSet * 5;
	}, null, 1);

	// turn on logging
	obs.log();

	// override internal _log to spy on arguments
	var changes = [];
	obs._log = function(previous, current) {
		changes.push({ current: current,  previous: previous });
	};

	canReflect.onValue(obs, function() {}); // needs to be bound
	canReflect.setValue(obs, 2);
	canReflect.setValue(obs, 3);

	assert.expect(1);
	setTimeout(function() {
		assert.deepEqual(
			changes,
			[{current: 10, previous: 5}, {current: 15, previous: 10}],
			"should print out current/previous values"
		);
		done();
	});
});

QUnit.test("getValueDependencies", function(assert) {
	var value = new SimpleObservable(2);

	var obs = new SettableObservable(function(lastSet) {
		return lastSet * value.get();
	}, null, 1);

	// unbound
	assert.equal(
		typeof canReflect.getValueDependencies(obs),
		"undefined",
		"returns undefined when the observable is unbound"
	);

	// bound
	canReflect.onValue(obs, function() {});
	assert.deepEqual(
		canReflect.getValueDependencies(obs).valueDependencies,
		new Set([obs.lastSetValue, value]),
		"should return the internal observation dependencies"
	);
});
