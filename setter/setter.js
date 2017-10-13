var canReflect = require('can-reflect');
var ObservationRecorder = require('can-observation-recorder');
var SimpleObservable = require("../can-simple-observable");
var Observation = require("can-observation");
var KeyTree = require('can-key-tree');
var queues = require("can-queues");
var SettableObservable = require("../settable/settable");

function SetterObservable(getter, setter) {
	this.handlers = new KeyTree([Object, Array], {
		onFirst: this.setup.bind(this),
		onEmpty: this.teardown.bind(this)
	});
    this.setter = setter;
	this.observation = new Observation(getter);
	this.handler = this.handler.bind(this);
}

SetterObservable.prototype = Object.create(SettableObservable.prototype);
SetterObservable.prototype.constructor = SetterObservable;
SetterObservable.prototype.set = function(newVal){
    this.setter(newVal);
};
canReflect.assignSymbols(SetterObservable.prototype, {
	"can.setValue": SetterObservable.prototype.set
});

module.exports = SetterObservable;
