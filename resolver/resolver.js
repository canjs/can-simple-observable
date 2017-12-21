var canReflect = require("can-reflect");
var ObservationRecorder = require("can-observation-recorder");
var Observation = require("can-observation");
var queues = require("can-queues");
var log = require("../log");
var valueEventBindings = require("can-event-queue/value/value");
var mapEventBindings = require("can-event-queue/map/map");

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
	// a place holder for remembering where we bind
	this.binder = {};
	//!steal-remove-start
	/*canReflect.assignSymbols(this, {
		"can.getName": function() {
			return (
				canReflect.getName(this.constructor) +
				"<" +
				canReflect.getName(fn) +
				">"
			);
		}
	});
	Object.defineProperty(this.handler, "name", {
		value: canReflect.getName(this) + ".handler"
	});
	Object.defineProperty(observe, "name", {
		value: canReflect.getName(fn) + "::" + canReflect.getName(this.constructor)
	});*/
	//!steal-remove-end
}

valueEventBindings(ResolverObservable.prototype);

canReflect.assignMap(ResolverObservable.prototype, {
	// call `obs.log()` to log observable changes to the browser console
	// The observable has to be bound for `.log` to be called
	log: log,
	constructor: ResolverObservable,
	listenTo: function(bindTarget, event, handler) {
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
		var returnedValue = this.resolver.call(this.context, this.resolve, this.listenTo, this.stopListening);
		if(returnedValue !== undefined) {
			this.value = returnedValue;
		}
	},
	onUnbound: function() {
		this.bound = false;
		mapEventBindings.stopListening.call(this.binder);
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
			return this.resolver.call(this.context);
		}
	},
	hasDependencies: function() {
		return canReflect.valueHasDependencies(this.observation);
	},
	getValueDependencies: function() {
		return canReflect.getValueDependencies(this.observation);
	}
});

canReflect.assignSymbols(ResolverObservable.prototype, {
	"can.getValue": ResolverObservable.prototype.get,
	"can.setValue": ResolverObservable.prototype.set,
	"can.isMapLike": false,
	"can.getPriority": function() {
		return canReflect.getPriority(this.observation);
	},
	"can.setPriority": function(newPriority) {
		canReflect.setPriority(this.observation, newPriority);
	},
	"can.valueHasDependencies": ResolverObservable.prototype.hasDependencies,
	"can.getValueDependencies": ResolverObservable.prototype.getValueDependencies
});

module.exports = ResolverObservable;
