var QUnit = require('steal-qunit');
var SettableObservable = require('./settable');
var SimpleObservable = require('../can-simple-observable');
var canReflect = require('can-reflect');
var ObservationRecorder = require("can-observation-recorder");

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
