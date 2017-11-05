var canReflect = require('can-reflect');
var ObservationRecorder = require('can-observation-recorder');
var SimpleObservable = require("../can-simple-observable");
var Observation = require("can-observation");
var KeyTree = require('can-key-tree');
var queues = require("can-queues");
var log = require("../log");

// This supports an "internal" settable value that the `fn` can derive its value from.
// It's useful to `can-define`.
// ```
// new SettableObservable(function(lastSet){
//   return lastSet * 5;
// }, null, 5)
// ```
function SettableObservable(fn, context, initialValue) {
	this.handlers = new KeyTree([Object, Array], {
		onFirst: this.setup.bind(this),
		onEmpty: this.teardown.bind(this)
	});
	this.lastSetValue = new SimpleObservable(initialValue);
	function observe() {
		return fn.call(context, this.lastSetValue.get());
	}
	this.handler = this.handler.bind(this);

	//!steal-remove-start
	canReflect.assignSymbols(this, {
		"can.getName": function() {
			return canReflect.getName(this.constructor) + "<" + canReflect.getName(fn) + ">";
		},
	});
	Object.defineProperty(this.handler, "name", {
		value: canReflect.getName(this) + ".handler",
	});
	Object.defineProperty(observe, "name", {
		value: canReflect.getName(fn)+"::"+canReflect.getName(this.constructor),
	});
	//!steal-remove-end

	this.observation = new Observation(observe, this);
}
var peek = ObservationRecorder.ignore(canReflect.getValue.bind(canReflect));


SettableObservable.prototype = {
	handler: function(newVal) {
		var old = this.value;
		this.value = newVal;

		//!steal-remove-start
		if (typeof this._log === "function") {
			this._log(old, newVal);
		}
		//!steal-remove-end

		// adds callback handlers to be called w/i their respective queue.
		queues.enqueueByQueue(this.handlers.getNode([]), this, [newVal, old], function() {
			return {};
		});
	},
	setup: function() {
		this.bound = true;
		canReflect.onValue(this.observation, this.handler, "notify");
		this.value = peek(this.observation);
	},
	teardown: function() {
		this.bound = false;
		canReflect.offValue(this.observation, this.handler, "notify");
	},
	set: function(newVal) {
		if (newVal !== this.lastSetValue.get()) {
			this.lastSetValue.set(newVal);
		}
	},
	get: function() {
		if (ObservationRecorder.isRecording()) {
			ObservationRecorder.add(this);
			if (!this.bound) {
				Observation.temporarilyBind(this);
			}
		}

		if (this.bound === true) {
			return this.value;
		} else {
			return this.observation.get();
		}
	},
	on: function(handler, queue) {
		this.handlers.add([queue || "mutate", handler]);
	},
	off: function(handler, queue) {
		if(!handler) {
			this.handlers.delete([queue|| "mutate"]);
		} else {
			this.handlers.delete([queue|| "mutate", handler]);
		}
	},
	hasDependencies: function(){
		return canReflect.valueHasDependencies( this.observation );
	},
	getValueDependencies: function() {
		return canReflect.getValueDependencies(this.observation);
	},
	// call `obs.log()` to log observable changes to the browser console
	// The observable has to be bound for `.log` to be called
	log: log
};

// fix the constructor reference
SettableObservable.prototype.constructor = SettableObservable;

canReflect.assignSymbols(SettableObservable.prototype, {
	"can.getValue": SettableObservable.prototype.get,
	"can.setValue": SettableObservable.prototype.set,
	"can.onValue": SettableObservable.prototype.on,
	"can.offValue": SettableObservable.prototype.off,
	"can.isMapLike": false,
	"can.getPriority": function(){
		return canReflect.getPriority( this.observation );
	},
	"can.setPriority": function(newPriority){
		canReflect.setPriority( this.observation, newPriority );
	},
	"can.valueHasDependencies": SettableObservable.prototype.hasDependencies,
	"can.getValueDependencies": SettableObservable.prototype.getValueDependencies
});

module.exports = SettableObservable;
