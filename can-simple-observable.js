var canReflect = require('can-reflect');
var canBatch = require('can-event/batch/batch');
var Observation = require('can-observation');
var CID = require('can-cid');
var ns = require('can-namespace');

/**
 * @module {function} can-simple-observable
 * @parent can-observables
 * @collection can-infrastructure
 * @package ./package.json
 * @description Create an observable value.
 *
 * @signature `observable(initialValue)`
 *
 * Creates an observable value that can be read, written, and observed using [can-reflect].
 *
 * @param {*} initialValue The initial value of the observable.
 *
 * @return {can-simple-observable} The observable.
 *
 * @body
 *
 * ## Use
 *
 * ```js
 *  var obs = observable('one');
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
module.exports = ns.simpleObservable = function simpleObservable(initialValue) {
	var value = initialValue;
	var handlers = [];

	var fn = function(newValue) {
		if(arguments.length) {
			value = newValue;
			handlers.forEach(function(handler) {
				canBatch.queue([handler, fn, [newValue]]);
			}, this);
		} else {
			Observation.add(fn);
			return value;
		}
	};

	CID(fn);

	canReflect.assignSymbols(fn, {
		'can.onValue': function(handler) {
			handlers.push(handler);
		},
		'can.offValue': function(handler) {
			var index = handlers.indexOf(handler);
			handlers.splice(index, 1);
		},
		'can.setValue': function(newValue) {
			return fn(newValue);
		},
		'can.getValue': function() {
			return fn();
		}
	});

	return fn;
};
