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

    /*
    canReflect.setValue(obs, 'two');
    ObservationRecorder.start();
    QUnit.equal(canReflect.getValue(obs), 'two', 'setValue');
    var dependencies = ObservationRecorder.stop();
    QUnit.ok(dependencies.valueDependencies.has(obs), "was recorded");



    canReflect.setValue(obs, 'three');

    canReflect.offValue(obs, handler);
    canReflect.setValue(obs, 'four');

    QUnit.equal(canReflect.getValue(obs), 'four', 'getValue after offValue');*/
});
