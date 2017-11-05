var canReflect = require('can-reflect');
var ObservationRecorder = require('can-observation-recorder');
var ns = require('can-namespace');
var KeyTree = require('can-key-tree');
var queues = require("can-queues");
var log = require("./log");

/**
 * @module {function} can-simple-observable
 * @parent can-infrastructure
 * @package ./package.json
 * @description Create an observable value.
 *
 * @signature `new SimpleObservable(initialValue)`
 *
 * Creates an observable value that can be read, written, and observed using [can-reflect].
 *
 * @param {*} initialValue The initial value of the observable.
 *
 * @return {can-simple-observable} An observable instance
 *
 * @body
 *
 * ## Use
 *
 * ```js
 *  var obs = new SimpleObservable('one');
 *
 *  canReflect.getValue(obs); // -> "one"
 *
 *  canReflect.setValue(obs, 'two');
 *  canReflect.getValue(obs); // -> "two"
 *
 *  function handler(newValue) {
 *    // -> "three"
 *  };
 *  canReflect.onValue(obs, handler);
 *  canReflect.setValue(obs, 'three');
 *
 *  canReflect.offValue(obs, handler);
 * ```
 */
function SimpleObservable(initialValue) {
	// Store handlers by queue
	this.handlers = new KeyTree([Object, Array]);
	this.value = initialValue;
}
SimpleObservable.prototype = {
	constructor: SimpleObservable,
	get: function(){
		ObservationRecorder.add(this);
		return this.value;
	},
	set: function(value){
		var old = this.value;
		this.value = value;
		// adds callback handlers to be called w/i their respective queue.
		queues.enqueueByQueue(this.handlers.getNode([]), this, [value, old]
			//!steal-remove-start
			/* jshint laxcomma: true */
			, null
			, [ canReflect.getName(this), "changed to", value, "from", old ]
			/* jshint laxcomma: false */
			//!steal-remove-end
		);
		//!steal-remove-start
		if (typeof this._log === "function") {
			this._log(old, value);
		}
		//!steal-remove-end
	},
	// .on( handler(newValue,oldValue), queue="mutate")
	on: function(handler, queue){
		this.handlers.add([queue|| "mutate", handler]);
	},
	off: function(handler, queueName){
		if(handler === undefined) {
			if(queueName === undefined) {
				this.handlers.delete([]);
			} else {
				this.handlers.delete([queueName]);
			}
		} else {
			this.handlers.delete([queueName || "mutate", handler]);
		}
	},
	log: log
};

canReflect.assignSymbols(SimpleObservable.prototype,{
	"can.getValue": SimpleObservable.prototype.get,
	"can.setValue": SimpleObservable.prototype.set,
	"can.onValue": SimpleObservable.prototype.on,
	"can.offValue": SimpleObservable.prototype.off,
	"can.isMapLike": false,
	"can.valueHasDependencies": function(){
		return true;
	},

	//!steal-remove-start
	"can.getName": function() {
		var value = this.value;
		if (typeof value !== 'object' || value === null) {
			value = JSON.stringify(value);
		}
		else {
			value = '';
		}

		return canReflect.getName(this.constructor) + "<" + value + ">";
	},
	//!steal-remove-end
});

module.exports = ns.SimpleObservable = SimpleObservable;
