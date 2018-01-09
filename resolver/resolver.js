var canReflect = require("can-reflect");
var ObservationRecorder = require("can-observation-recorder");
var Observation = require("can-observation");
var queues = require("can-queues");
var log = require("../log");
var valueEventBindings = require("can-event-queue/value/value");
var mapEventBindings = require("can-event-queue/map/map");
var SettableObservable = require("../settable/settable");

// This supports an "internal" settable value that the `fn` can derive its value from.
// It's useful to `can-define`.
// ```
// new SettableObservable(function(lastSet){
//   return lastSet * 5;
// }, null, 5)
// ```
function ResolverObservable(resolver, context) {
	this.resolver = resolver;
	this.context = context;
	this.resolve = this.resolve.bind(this);
	this.listenTo = this.listenTo.bind(this);
	this.stopListening = this.stopListening.bind(this);
	this.contextHandlers = new WeakMap();
	this.teardown = null;
	// a place holder for remembering where we bind
	this.binder = {};
	//!steal-remove-start
	canReflect.assignSymbols(this, {
		"can.getName": function() {
			return (
				canReflect.getName(this.constructor) +
				"<" +
				canReflect.getName(resolver) +
				">"
			);
		}
	});
	//!steal-remove-end
}
ResolverObservable.prototype = Object.create(SettableObservable.prototype);

canReflect.assignMap(ResolverObservable.prototype, {
	constructor: ResolverObservable,
	listenTo: function(bindTarget, event, handler) {
		//Object.defineProperty(this.handler, "name", {
		//	value: canReflect.getName(this) + ".handler"
		//});
		if(canReflect.isPrimitive(bindTarget)) {
			handler = event;
			event = bindTarget;
			bindTarget = this.context;
		}
		if(typeof event === "function") {
			handler = event;
			event = undefined;
		}
		var contextHandler = handler.bind(this.context);
		this.contextHandlers.set(handler, contextHandler);
		mapEventBindings.listenTo.call(this.binder, bindTarget, event, contextHandler, "notify");
	},
	stopListening: function(bindTarget, event, handler){
		if(canReflect.isPrimitive(bindTarget)) {
			handler = event;
			event = bindTarget;
			bindTarget = this.context;
		}
		if(typeof event === "function") {
			handler = event;
			event = undefined;
		}
		var contextHandler = this.contextHandlers.get(handler);
		mapEventBindings.stopListening.call(this.binder, bindTarget, event, contextHandler, "notify");
	},
	resolve: function(newVal) {
		// if we are setting up the initial binding and we get a resolved value
		// do not emit events for it.
		if(this.isBinding) {
			this.value = newVal;
			return;
		}
		var old = this.value;

		if(newVal !== old) {
			this.value = newVal;
			//!steal-remove-start
			if (typeof this._log === "function") {
				this._log(old, newVal);
			}
			//!steal-remove-end

			// adds callback handlers to be called w/i their respective queue.
			queues.enqueueByQueue(
				this.handlers.getNode([]),
				this,
				[newVal, old],
				function() {
					return {};
				}
			);
		}
	},
	onBound: function() {
		this.bound = true;
		this.isBinding = true;
		this.teardown = this.resolver.call(this.context, this.resolve, this.listenTo, this.stopListening);
		this.isBinding = false;
	},
	onUnbound: function() {
		this.bound = false;
		mapEventBindings.stopListening.call(this.binder);
		if(this.teardown != null) {
			this.teardown();
			this.teardown = null;
		}
	},
	set: function(newVal) {
		throw new Error("unable to set");
		/*if (newVal !== this.lastSetValue.get()) {
			this.lastSetValue.set(newVal);
		}*/
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
			var handler = function(){};
			this.on(handler);
			var val = this.value;
			this.off(handler);
			return val;
		}
	}
});


module.exports = ResolverObservable;
