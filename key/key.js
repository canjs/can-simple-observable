var canKey = require("can-key");
var canReflect = require("can-reflect");
var Observation = require("can-observation");
var SettableObservable = require("../settable/settable");

function KeyObservable(root, keyPath) {
	keyPath = "" + keyPath;
	this._keyPath = keyPath;
	this._root = root;

	SettableObservable.call(this, function() {
		return canKey.get(root, keyPath);
	}, root);
}

KeyObservable.prototype = Object.create(SettableObservable.prototype);
KeyObservable.prototype.constructor = KeyObservable;
KeyObservable.prototype.set = function(newVal) {
	canKey.set(this._root, this._keyPath, newVal);
};
canReflect.assignSymbols(KeyObservable.prototype, {
	"can.setValue": KeyObservable.prototype.set
});

module.exports = KeyObservable;
