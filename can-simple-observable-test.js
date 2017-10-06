var QUnit = require('steal-qunit');
var SimpleObservable = require('can-simple-observable');
var canReflect = require('can-reflect');
var ObservationRecorder = require("can-observation-recorder");

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
