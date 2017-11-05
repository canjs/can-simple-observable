var QUnit = require('steal-qunit');
var SimpleObservable = require('can-simple-observable');
var canReflect = require('can-reflect');
var ObservationRecorder = require("can-observation-recorder");

require("./settable/settable-test");
require("./async/async-test");
require("./setter/setter-test");
require("./make-compute/make-compute-test");

QUnit.module('can-simple-observable');

QUnit.test('basics', function(){
    expect(5);
    var obs = new SimpleObservable('one');

    QUnit.equal(canReflect.getValue(obs), 'one', 'getValue');

    canReflect.setValue(obs, 'two');
    ObservationRecorder.start();
    QUnit.equal(canReflect.getValue(obs), 'two', 'setValue');
    var dependencies = ObservationRecorder.stop();
    QUnit.ok(dependencies.valueDependencies.has(obs), "was recorded");

    var handler = function(newValue) {
        QUnit.equal(newValue, 'three', 'onValue');
    };
    canReflect.onValue(obs, handler);
    canReflect.setValue(obs, 'three');

    canReflect.offValue(obs, handler);
    canReflect.setValue(obs, 'four');

    QUnit.equal(canReflect.getValue(obs), 'four', 'getValue after offValue');
});
if(System.env.indexOf("production") < 0) {

    QUnit.test("log observable changes", function(assert) {
    	var done = assert.async();
    	var obs = new SimpleObservable("one");

    	// turn on debugging
    	obs.log();

    	assert.expect(2);
    	obs._log = function(previous, current) {
    		assert.equal(current, "two", "should get current value");
    		assert.equal(previous, "one", "should get previous value");
    		done();
    	};

    	canReflect.setValue(obs, "two");
    });

}
