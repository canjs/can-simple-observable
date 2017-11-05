var QUnit = require('steal-qunit');
var SimpleObservable = require('../can-simple-observable');
var canReflect = require('can-reflect');
var makeCompute = require("./make-compute");

QUnit.module('can-simple-observable/make-compute');

QUnit.test('basics', 4, function(){
    var compute = makeCompute(new SimpleObservable(5));
    QUnit.equal( compute(), 5, "read");
    compute(6);
    QUnit.equal( compute(), 6, "write");

    compute.on("change", function(ev, newVal, oldVal){
        QUnit.equal(newVal, 7, "bound newVal");
        QUnit.equal(oldVal, 6, "bound newVal");
    });
    compute(7);
});
