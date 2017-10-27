var QUnit = require('steal-qunit');
var AsyncObservable = require('./async');
var SimpleObservable = require('../can-simple-observable');
var canReflect = require('can-reflect');
var ObservationRecorder = require("can-observation-recorder");

QUnit.module('can-simple-observable/async');

QUnit.test('basics', function(assert){
    var done = assert.async();
    var value = new SimpleObservable(1);


    var obs = new AsyncObservable(function(lastSet, resolve){
        if(!resolve) {
            return "default";
        }
        if(value.get() === 1) {
            setTimeout(function(){
                resolve("a");
            }, 1);
        } else {
            setTimeout(function(){
                resolve("b");
            }, 1);
        }
    });

    // Unbound and unobserved behavior
    QUnit.equal(canReflect.getValue(obs), 'default', 'getValue unbound');

    // Unbound , being observed behavior
    ObservationRecorder.start();
    QUnit.equal(canReflect.getValue(obs), undefined, "getValue being bound");
    var dependencies = ObservationRecorder.stop();
    QUnit.ok(!dependencies.valueDependencies.has(value), "did not record value");
    QUnit.ok(dependencies.valueDependencies.has(obs), "did record observable");
    QUnit.equal(dependencies.valueDependencies.size, 1, "only one value to listen to");

    var changes = 0;
    var handler = function(newValue) {
        changes++;
        if(changes === 1) {
            QUnit.equal(newValue, 'a', 'onValue a');
            value.set(2);
        } else {
            QUnit.equal(newValue, 'b', 'onValue b');
            done();
        }
    };
    canReflect.onValue(obs, handler);

});


QUnit.test("get and set Priority", function(){
    var value = new SimpleObservable(1);

    var obs = new AsyncObservable(function(lastSet, resolve){
        if(!resolve) {
            return "default";
        }
        if(value.get() === 1) {
            setTimeout(function(){
                resolve("a");
            }, 1);
        } else {
            setTimeout(function(){
                resolve("b");
            }, 1);
        }
    });

    canReflect.setPriority(obs, 5);

    QUnit.equal(canReflect.getPriority(obs), 5, "set priority");
});

QUnit.test("prevent a getter returning undefined from overwriting last resolved value", function(){
    var value = new SimpleObservable(1);

    var obs = new AsyncObservable(function(lastSet, resolve){
        if(value.get() === 1) {
            return null;
        } else {
            resolve(4);
        }

    });
    obs.on(function(){});
    QUnit.equal( obs.get(), null );
    value.set(2);

    QUnit.equal( obs.get(), 4 );

});

QUnit.test("prevent a getter returning undefined from overwriting last resolved value at the start", function(){
    var value = new SimpleObservable(1);

    var obs = new AsyncObservable(function(lastSet, resolve){
        resolve(value.get()*2);
    });
    obs.on(function(){});
    QUnit.equal( obs.get(), 2 );
    value.set(2);

    QUnit.equal( obs.get(), 4 );

});
if(System.env.indexOf("production") < 0) {
    QUnit.test("log async observable changes", function(assert) {
    	var done = assert.async();
    	var value = new SimpleObservable(1);

    	var obs = new AsyncObservable(function(lastSet, resolve) {
    		if (value.get() === 1) {
    			setTimeout(function(){
    				resolve("b");
    			}, 1);
    		} else {
    			setTimeout(function(){
    				resolve("c");
    			}, 1);
    		}
    	}, null, "a");

    	// turn on logging
    	obs.log();

    	// override the internal _log to spy on arguments
    	var changes = [];
    	obs._log = function(previous, current) {
    		changes.push({ previous: previous, current: current });
    	};

    	// make sure the observable is bound
    	canReflect.onValue(obs, function() {});

    	// trigger observation changes
    	value.set("2");

    	assert.expect(1);
    	setTimeout(function() {
    		assert.deepEqual(changes, [
    			{ current: "b", previous: undefined },
    			{ current: "c", previous: "b" },
    		]);
    		done();
    	}, 10);
    });
}
