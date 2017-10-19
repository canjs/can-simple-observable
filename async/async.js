var canReflect = require('can-reflect');
var ObservationRecorder = require('can-observation-recorder');
var SimpleObservable = require("../can-simple-observable");
var Observation = require("can-observation");
var KeyTree = require('can-key-tree');
var queues = require("can-queues");
var SettableObservable = require("../settable/settable");

// This is an observable that is like `settable`, but passed a `resolve`
// function that can resolve the value of this observable late.
function AsyncObservable(fn, context, initialValue) {
	this.handlers = new KeyTree([Object, Array], {
		onFirst: this.setup.bind(this),
		onEmpty: this.teardown.bind(this)
	});
	this.resolve = this.resolve.bind(this);
	this.lastSetValue = new SimpleObservable(initialValue);
	this.handler = this.handler.bind(this);

	function observe() {
		this.resolveCalled = false;
		return fn.call(context, this.lastSetValue.get(), this.bound === true ? this.resolve : undefined);
	}

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
AsyncObservable.prototype = Object.create(SettableObservable.prototype);
AsyncObservable.prototype.constructor = AsyncObservable;

AsyncObservable.prototype.handler = function(newVal) {
	if (newVal !== undefined) {
		SettableObservable.prototype.handler.apply(this, arguments);
	}
};

var peek = ObservationRecorder.ignore(canReflect.getValue.bind(canReflect));
AsyncObservable.prototype.setup = function() {
	this.bound = true;
	canReflect.onValue(this.observation, this.handler, "notify");
	if(!this.resolveCalled) {
		this.value = peek(this.observation);
	}
};

AsyncObservable.prototype.resolve = function resolve(newVal) {
	this.resolveCalled = true;
	var old = this.value;
	this.value = newVal;
	// adds callback handlers to be called w/i their respective queue.
	queues.enqueueByQueue(this.handlers.getNode([]), this, [newVal, old], function() {
		return {};
	});
};


module.exports = AsyncObservable;
