var canReflect = require('can-reflect');
var ObservationRecorder = require('can-observation-recorder');
var ns = require('can-namespace');
var KeyTree = require('can-key-tree');
var queues = require("can-queues");

function makeMeta(handler, context, args) {
	return {
		log: [ canReflect.getName(handler), "called because", canReflect.getName(context), "changed to", JSON.stringify(args[0]), "from", JSON.stringify(args[1]) ],
	};
}

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
		queues.enqueueByQueue(this.handlers.getNode([]), this, [value, old], makeMeta);
	},
	// .on( handler(newValue,oldValue), queue="mutate")
	on: function(handler, queue){
		this.handlers.add([queue|| "mutate", handler]);
	},
	off: function(handler, queue){
		this.handlers.delete([queue|| "mutate", handler]);
	}
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
		return canReflect.getName(this.constructor) + "<>";
	},
	//!steal-remove-end
});

module.exports = ns.SimpleObservable = SimpleObservable;
