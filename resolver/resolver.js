var canReflect = require("can-reflect");
var canSymbol = require("can-symbol");
var ObservationRecorder = require("can-observation-recorder");
var Observation = require("can-observation");
var queues = require("can-queues");
var mapEventBindings = require("can-event-queue/map/map");
var SettableObservable = require("../settable/settable");
var SimpleObservable = require("../can-simple-observable");

function ResolverObservable(resolver, context) {
	this.resolver = resolver;
	this.context = context;
	this.resolve = this.resolve.bind(this);
	this.listenTo = this.listenTo.bind(this);
	this.stopListening = this.stopListening.bind(this);
	this.update = this.update.bind(this);
	this.lastSet = new SimpleObservable(undefined);

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
	Object.defineProperty(this.update, "name", {
		value: canReflect.getName(this) + ".update"
	});

	canReflect.assignSymbols(this.lastSet, {
		"can.getName": function() {
			return (
				canReflect.getName(this.constructor)  +"::lastSet"+
				"<" +
				canReflect.getName(resolver) +
				">"
			);
		}
	});
	//!steal-remove-end
}
ResolverObservable.prototype = Object.create(SettableObservable.prototype);

function deleteHandler(bindTarget, event, queue, handler){
	mapEventBindings.off.call(bindTarget, event, handler, queue);
}

canReflect.assignMap(ResolverObservable.prototype, {
	constructor: ResolverObservable,
	listenTo: function(bindTarget, event, handler, queueName) {
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
		mapEventBindings.listenTo.call(this.binder, bindTarget, event, contextHandler, queueName || "notify");
	},
	stopListening: function(){

		var meta = this.binder[canSymbol.for("can.meta")];
		var listenHandlers = meta && meta.listenHandlers;
		if(listenHandlers) {
			var keys = mapEventBindings.stopListeningArgumentsToKeys.call({context: this.context, defaultQueue: "notify"});

			listenHandlers.delete(keys, deleteHandler);
		}
		return this;
	},
	resolve: function(newVal) {
		this.value = newVal;
		// if we are setting up the initial binding and we get a resolved value
		// do not emit events for it.

		if(this.isBinding) {
			this.lastValue = this.value;
			return;
		}

		if(this.value !== this.lastValue) {
			queues.batch.start();
			queues.deriveQueue.enqueue(
				this.update,
				this,
				[],
				{
					//!steal-remove-start
					/* jshint laxcomma: true */
					log: [canReflect.getName(this.update)],
					reasonLog: [canReflect.getName(this), "resolved with", newVal]
					/* jshint laxcomma: false */
					//!steal-remove-end
				}
			);
			queues.batch.stop();
		}
	},
	update: function(){

		if(this.lastValue !== this.value) {

			var old = this.lastValue;
			this.lastValue = this.value;
			//!steal-remove-start
			if (typeof this._log === "function") {
				this._log(old, this.value);
			}
			//!steal-remove-end

			// adds callback handlers to be called w/i their respective queue.
			queues.enqueueByQueue(
				this.handlers.getNode([]),
				this,
				[this.value, old]
			);
		}
	},
	onBound: function() {
		this.bound = true;
		this.isBinding = true;
		this.teardown = this.resolver.call(this.context, this.resolve, this.listenTo, this.stopListening, this.lastSet);
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
	set: function(value) {
		this.lastSet.set(value);

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

canReflect.assignSymbols(ResolverObservable.prototype, {
	"can.getValue": ResolverObservable.prototype.get,
	"can.setValue": ResolverObservable.prototype.set,
	"can.isMapLike": false,
	"can.getPriority": function() {
		// TODO: the priority should come from any underlying values
		return this.priority || 0;
	},
	"can.setPriority": function(newPriority) {
		this.priority = newPriority;
	},
	"can.valueHasDependencies": SettableObservable.prototype.hasDependencies,
	"can.getValueDependencies": SettableObservable.prototype.getValueDependencies
});


module.exports = ResolverObservable;