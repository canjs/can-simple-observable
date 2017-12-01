var log = require("./log");
var ns = require("can-namespace");
var canSymbol = require("can-symbol");
var canReflect = require("can-reflect");
var ObservationRecorder = require("can-observation-recorder");
var valueEventBindings = require("can-event-queue/value/value");

var dispatchSymbol = canSymbol.for("can.dispatch");

/**
 * @module {function} can-simple-observable
 * @parent can-observables
 * @collection can-infrastructure
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
	this.value = initialValue;
}

// mix in the value-like object event bindings
valueEventBindings(SimpleObservable.prototype);

Object.assign(SimpleObservable.prototype, {
	log: log,
	get: function(){
		ObservationRecorder.add(this);
		return this.value;
	},
	set: function(value){
		var old = this.value;
		this.value = value;

		this[dispatchSymbol](value, old);
	}
});

canReflect.assignSymbols(SimpleObservable.prototype, {
	"can.getValue": SimpleObservable.prototype.get,
	"can.setValue": SimpleObservable.prototype.set,
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
