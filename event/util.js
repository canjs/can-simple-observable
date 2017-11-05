var domEvents = require("can-util/dom/events/events");
var canReflect = require("can-reflect");
var canSymbol = require("can-symbol");

var onKeyValueSymbol = canSymbol.for("can.onKeyValue"),
    offKeyValueSymbol = canSymbol.for("can.offKeyValue"),
    onEventSymbol = canSymbol.for("can.onEvent"),
    offEventSymbol = canSymbol.for("can.offEvent"),
    onValueSymbol = canSymbol.for("can.onValue"),
    offValueSymbol = canSymbol.for("can.offValue");

module.exports = {
	on: function(eventName, handler, queue) {
		var listenWithDOM = domEvents.canAddEventListener.call(this);
		if(listenWithDOM) {
            var method = typeof handler === "string" ? "addDelegateListener" : "addEventListener";
			domEvents[method].call(this, eventName, handler, queue);
		} else {
            if(this[onKeyValueSymbol]) {
                canReflect.onKeyValue(this, eventName, handler, queue);
            } else if(this[onEventSymbol]) {
                this[onEventSymbol](eventName, handler, queue);
            } else if("addEventListener" in this) {
                this.addEventListener(eventName, handler, queue);
            } else {
                if(!eventName && this[onValueSymbol]) {
                    canReflect.onValue(this, handler);
                } else {
                    throw new Error("can-control: Unable to bind "+eventName);
                }
            }
		}
	},
	off: function(eventName, handler, queue) {

		var listenWithDOM = domEvents.canAddEventListener.call(this);
		if(listenWithDOM) {
            var method = typeof handler === "string" ? "removeDelegateListener" : "removeEventListener";
			domEvents[method].call(this, eventName, handler, queue);
		} else {

            if(this[offKeyValueSymbol]) {
                canReflect.offKeyValue(this, eventName, handler, queue);
            } else if(this[offEventSymbol]) {
                this[offEventSymbol](eventName, handler, queue);
            } else if("removeEventListener" in this) {
                this.removeEventListener(eventName, handler, queue);
            } else {
                if(!eventName && this[offValueSymbol]) {
                    canReflect.offValue(this, handler);
                } else {
                    throw new Error("can-control: Unable to unbind "+eventName);
                }

            }
		}
	}
};
