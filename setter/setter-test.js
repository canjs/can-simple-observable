var QUnit = require('steal-qunit');
var SetterObservable = require('./setter');
var SimpleObservable = require('../can-simple-observable');
var canReflect = require('can-reflect');
var ObservationRecorder = require("can-observation-recorder");

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
