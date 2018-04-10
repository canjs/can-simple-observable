var canKey = require("can-key");
var canReflect = require("can-reflect");
var canReflectDependencies = require("can-reflect-dependencies");
var Observation = require("can-observation");
var SettableObservable = require("../settable/settable");

function KeyObservable(root, keyPath) {
	keyPath = "" + keyPath;
	this._keyPath = keyPath;
	this._root = root;

	SettableObservable.call(this, function() {
		return canKey.get(root, keyPath);
	}, root);

	var keyPathParts = keyPath.split(".");

	// Determine the last object in the keyPath that this observable actually changes
	var keyPathSplit = keyPathParts.slice();
	var lastPartOfPath = keyPathSplit.pop();
	var restOfPathJoined = keyPathSplit.join(".");
	var rootMutationObject = (restOfPathJoined) ? canKey.get(root, restOfPathJoined) : root;

	canReflect.assignSymbols(this, {
		"can.getName": function getName() {
			var objectName = canReflect.getName(root);
			return "KeyObservable<" + objectName + "." + keyPath + ">";
		},

		// Register what this observable changes
		"can.getWhatIChange": function getWhatIChange() {
			return {
				mutate: {
					keyDependencies: new Map([
						[rootMutationObject, new Set([lastPartOfPath])]
					])
				}
			};
		}
	});

	// Register that this observable changes the objects along the keyPath
	var i, key, mutationObject;
	var keyPathPartsLength = keyPathParts.length;
	for (i = 0; i < keyPathPartsLength; i++) {
		mutationObject = mutationObject ? canReflect.getKeyValue(mutationObject, key) : root;
		key = keyPathParts[i];
		canReflectDependencies.addMutatedBy(mutationObject, key, this);
	}
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
