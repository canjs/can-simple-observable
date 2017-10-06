var canReflect = require('can-reflect');
var ObservationRecorder = require('can-observation-recorder');
var SimpleObservable = require("../can-simple-observable");
var Observation = require("can-observation");
var KeyTree = require('can-key-tree');
var queues = require("can-queues");


function AsyncObservable(fn, context, initialValue) {
	this.handlers = new KeyTree([Object, Array], {
		onFirst: this.setup.bind(this),
		onEmpty: this.teardown.bind(this)
	});
	this.resolve = this.resolve.bind(this);
	this.lastSetValue = new SimpleObservable(initialValue);
	this.observation = new Observation(function() {
		return fn.call(context, this.lastSetValue.get(), this.bound === true ? this.resolve : undefined);
	}, this);
	this.handler = this.handler.bind(this);
}

AsyncObservable.prototype = {
	handler: function(newVal) {
		if (newVal !== undefined) {
			var old = this.value;
			this.value = newVal;
			// adds callback handlers to be called w/i their respective queue.
			queues.enqueueByQueue(this.handlers.getNode([]), this, [newVal, old], function() {
				return {};
			});
		}
	},
	setup: function() {
		this.bound = true;
		canReflect.onValue(this.observation, this.handler, "notify");
	},
	teardown: function() {
		this.bound = false;
		canReflect.offValue(this.observation, this.handler, "notify");
	},
	resolve: function(newVal) {
		var old = this.value;
		this.value = newVal;
		// adds callback handlers to be called w/i their respective queue.
		queues.enqueueByQueue(this.handlers.getNode([]), this, [newVal, old], function() {
			return {};
		});
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
		this.handlers.delete([queue || "mutate", handler]);
	}
};

canReflect.assignSymbols(AsyncObservable.prototype, {
	"can.getValue": AsyncObservable.prototype.get,
	"can.setValue": AsyncObservable.prototype.set,
	"can.onValue": AsyncObservable.prototype.on,
	"can.offValue": AsyncObservable.prototype.off
});

module.exports = AsyncObservable;
