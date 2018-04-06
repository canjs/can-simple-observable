var QUnit = require("steal-qunit");
var KeyObservable = require("./key");
var canReflect = require("can-reflect");

QUnit.module("can-simple-observable/key");

QUnit.test("basics", function(assert) {
    var value = {foo: {bar: "baz"}};
    var obs = new KeyObservable(value, "foo.bar");

    // Unbound and unobserved behavior
    assert.equal(canReflect.getValue(obs), "baz", "getValue unbound");

    canReflect.setValue(obs, "new");
    assert.equal(canReflect.getValue(value).foo.bar, "new", "value set");
    assert.equal(canReflect.getValue(obs), "new", "getValue unbound");
});

QUnit.test("get and set Priority", function(assert) {
    var value = {foo: {bar: "baz"}};
    var obs = new KeyObservable(value, "foo.bar");

    canReflect.setPriority(obs, 5);
    assert.equal(canReflect.getPriority(obs), 5, "set priority");
});
