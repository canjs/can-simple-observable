var canReflect = require('can-reflect');
var Observation = require("can-observation");
var KeyTree = require('can-key-tree');
var SettableObservable = require("../settable/settable");

// SetterObservable's call a function when set. Their getter is backed up by an
// observation.
function SetterObservable(getter, setter) {
	this.handlers = new KeyTree([Object, Array], {
		onFirst: this.setup.bind(this),
		onEmpty: this.teardown.bind(this)
	});
	this.setter = setter;
	this.observation = new Observation(getter);
	this.handler = this.handler.bind(this);

	//!steal-remove-start
	canReflect.assignSymbols(this, {
		"can.getName": function() {
			return canReflect.getName(this.constructor) + "<" + canReflect.getName(getter) + ">";
		},
	});
	Object.defineProperty(this.handler, "name", {
		value: canReflect.getName(this) + ".handler",
	});
	//!steal-remove-end
}

SetterObservable.prototype = Object.create(SettableObservable.prototype);
SetterObservable.prototype.constructor = SetterObservable;
SetterObservable.prototype.set = function(newVal){
    this.setter(newVal);
};
SetterObservable.prototype.hasDependencies = function(){
	return canReflect.valueHasDependencies( this.observation );
};
canReflect.assignSymbols(SetterObservable.prototype, {
	"can.setValue": SetterObservable.prototype.set,
	"can.valueHasDependencies": SetterObservable.prototype.hasDependencies
});

module.exports = SetterObservable;
