var QUnit = require('steal-qunit');
var observable = require('can-simple-observable');
var canReflect = require('can-reflect');

QUnit.module('can-simple-observable');

QUnit.test('basics', function(){
    expect(4);
    var obs = observable('one');

    QUnit.equal(canReflect.getValue(obs), 'one', 'getValue');

    canReflect.setValue(obs, 'two');
    QUnit.equal(canReflect.getValue(obs), 'two', 'setValue');

    var handler = function(newValue) {
        QUnit.equal(newValue, 'three', 'onValue');
    };
    canReflect.onValue(obs, handler);
    canReflect.setValue(obs, 'three');

    canReflect.offValue(obs, handler);
    canReflect.setValue(obs, 'four');

    QUnit.equal(canReflect.getValue(obs), 'four', 'getValue after offValue');
});
