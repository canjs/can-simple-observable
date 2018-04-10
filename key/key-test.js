var QUnit = require("steal-qunit");
var KeyObservable = require("./key");
var canReflect = require("can-reflect");
var canReflectDeps = require("can-reflect-dependencies");
var SimpleMap = require("can-simple-map");

QUnit.module("can-simple-observable/key");

QUnit.test("basics", function(assert) {
	var outer = {inner: {key: "hello"}};
	var observable = new KeyObservable(outer, "inner.key");

	// Unbound and unobserved behavior
	assert.equal(canReflect.getValue(observable), "hello", "getValue unbound");

	canReflect.setValue(observable, "aloha");
	assert.equal(canReflect.getValue(outer).inner.key, "aloha", "value set");
	assert.equal(canReflect.getValue(observable), "aloha", "getValue unbound");
});

QUnit.test("get and set Priority", function(assert) {
	var outer = {inner: {key: "hello"}};
	var observable = new KeyObservable(outer, "inner.key");

	canReflect.setPriority(observable, 5);
	assert.equal(canReflect.getPriority(observable), 5, "set priority");
});

QUnit.test("observable has a helpful name", function() {
	var outer = {inner: {key: "hello"}};
	var observable = new KeyObservable(outer, "inner.key");
	QUnit.equal(
		canReflect.getName(observable),
		"KeyObservable<Object{}.inner.key>",
		"observable has the correct name"
	);
});

QUnit.test("dependency data", function(assert) {
	var outer = new SimpleMap({inner: new SimpleMap({key: "hello"})});
	var observable = new KeyObservable(outer, "inner.key");

	// The observable must be bound before it returns dependency data
	canReflect.onValue(observable, function() {});

	// Check the observable’s dependency data
	var observableDepData = canReflectDeps.getDependencyDataOf(observable);
	assert.notOk(
		observableDepData.whatChangesMe.mutate,
		"the observable has no whatChangesMe.mutate dependencies"
	);
	assert.equal(
		observableDepData.whatChangesMe.derive.keyDependencies.size,
		2,
		"the observable has two derive.keyDependencies"
	);
	assert.ok(
		observableDepData.whatChangesMe.derive.keyDependencies.get(outer).has("inner"),
		"the observable is changed by outer’s 'inner' property"
	);
	assert.ok(
		observableDepData.whatChangesMe.derive.keyDependencies.get(outer.get("inner")).has("key"),
		"the observable is changed by outer.inner’s 'key' property"
	);
	assert.equal(
		observableDepData.whatChangesMe.derive.valueDependencies.size,
		1,
		"the observable has one derive.valueDependencies"
	);
	assert.notOk(
		observableDepData.whatIChange.derive,
		"the observable has no whatIChange.derivedependencies"
	);
	assert.equal(
		observableDepData.whatIChange.mutate.keyDependencies.size,
		1,
		"the observable has one mutate.keyDependencies"
	);
	assert.ok(
		observableDepData.whatIChange.mutate.keyDependencies.get(outer.get("inner")).has("key"),
		"the observable changes outer.inner’s 'key' property"
	);

	// Check outer.inner’s dependency data
	var innerDepData = canReflectDeps.getDependencyDataOf(outer, "inner");
	assert.notOk(
		innerDepData.whatChangesMe.derive,
		"outer.inner has no whatChangesMe.derive dependencies"
	);
	assert.equal(
		innerDepData.whatChangesMe.mutate.keyDependencies.size,
		0,
		"outer.inner has zero mutate.keyDependencies"
	);
	assert.equal(
		innerDepData.whatChangesMe.mutate.valueDependencies.size,
		1,
		"outer.inner has one mutate.valueDependencies"
	);
	assert.ok(
		innerDepData.whatChangesMe.mutate.valueDependencies.has(observable),
		"outer.inner is changed by the observable"
	);
	assert.notOk(
		innerDepData.whatIChange.mutate,
		"outer.inner has no whatIChange.mutate dependencies"
	);
	assert.notOk(
		innerDepData.whatIChange.derive.keyDependencies,
		"outer.inner has zero derive.keyDependencies"
	);
	assert.equal(
		innerDepData.whatIChange.derive.valueDependencies.size,
		1,
		"outer.inner has one derive.valueDependencies"
	);
	assert.ok(
		innerDepData.whatIChange.derive.valueDependencies.has(observable.observation),
		"outer.inner changes the observable"
	);

	// Check outer.inner.key’s dependency data
	var keyDepData = canReflectDeps.getDependencyDataOf(outer.get("inner"), "key");
	assert.notOk(
		keyDepData.whatChangesMe.derive,
		"outer.inner.key has no whatChangesMe.derive dependencies"
	);
	assert.equal(
		keyDepData.whatChangesMe.mutate.keyDependencies.size,
		0,
		"outer.inner.key has zero mutate.keyDependencies"
	);
	assert.equal(
		keyDepData.whatChangesMe.mutate.valueDependencies.size,
		1,
		"outer.inner.key has one mutate.valueDependencies"
	);
	assert.ok(
		keyDepData.whatChangesMe.mutate.valueDependencies.has(observable),
		"outer.inner.key is changed by the observable"
	);
	assert.notOk(
		keyDepData.whatIChange.mutate,
		"outer.inner.key has no whatIChange.mutate dependencies"
	);
	assert.notOk(
		keyDepData.whatIChange.derive.keyDependencies,
		"outer.inner.key has zero derive.keyDependencies"
	);
	assert.equal(
		keyDepData.whatIChange.derive.valueDependencies.size,
		1,
		"outer.inner.key has one derive.valueDependencies"
	);
	assert.ok(
		keyDepData.whatIChange.derive.valueDependencies.has(observable.observation),
		"outer.inner.key changes the observable"
	);

});
