var QUnit = require('steal-qunit');
var SetterObservable = require('./setter');
var SimpleObservable = require('../can-simple-observable');
var canReflect = require('can-reflect');

QUnit.module('can-simple-observable/setter');

QUnit.test('basics', function(){

    var value = new SimpleObservable(2);


    var obs = new SetterObservable(function(){
        return value.get();
    }, function(newVal){
        value.set(newVal);
    });

    // Unbound and unobserved behavior
    QUnit.equal(canReflect.getValue(obs), 2, 'getValue unbound');

    canReflect.setValue(obs,3);
    QUnit.equal(canReflect.getValue(value), 3, 'value set');
    QUnit.equal(canReflect.getValue(obs), 3, 'getValue unbound');
});

QUnit.test("get and set Priority", function(){
    var value = new SimpleObservable(2);

    var obs = new SetterObservable(function(){
        return value.get();
    }, function(newVal){
        value.set(newVal);
    });

    canReflect.setPriority(obs, 5);


    QUnit.equal(canReflect.getPriority(obs), 5, "set priority");
});

QUnit.test("log observable changes", function(assert) {
	var done = assert.async();
	var value = new SimpleObservable(2);

	var obs = new SetterObservable(function() {
		return value.get();
	}, function(newVal){
		value.set(newVal);
	});

	// turn on logging
	obs.log();

	// override _log to spy on arguments
	var changes = [];
	obs._log = function(previous, current) {
		changes.push({ current: current, previous: previous });
	};

	canReflect.onValue(obs, function() {}); // needs to be bound
	canReflect.setValue(obs, 3);
	canReflect.setValue(obs, 4);

	assert.expect(1);
	setTimeout(function() {
		assert.deepEqual(
			changes,
			[{current: 3, previous: 2}, {current: 4, previous: 3}],
			"should print out current/previous values"
		);
		done();
	});
});
