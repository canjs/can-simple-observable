var canReflect = require("can-reflect");
var SettableObservable = require("../settable/settable");

function PropertyObservable(root, key){
    key = ""+key;
    this.key = key;
    this.root = root;
    SettableObservable.call(this, function(){
        return canReflect.setKeyValue( this, key );
    }, root);
}

PropertyObservable.prototype = Object.create(SettableObservable.prototype);

PropertyObservable.prototype.set = function(newVal) {
    canReflect.setKeyValue( this.root, this.key, newVal );
};


module.exports = KeyObservable;

var isListLike = canReflect.isObservableLike(args[0]) && canReflect.isListLike(args[0]);
var isMapLike = canReflect.isObservableLike(args[0]) && canReflect.isMapLike(args[0]);
if(isMapLike || isListLike) {
    var map = args[0];
    var propertyName = args[1];
    var mapGetterSetter = function(newValue){
        if(arguments.length) {
            observeReader.set(map,propertyName, newValue);
        } else {
            // forces length to be read
            if(isListLike) {
                observeReader.get(map,"length");
            }
            return observeReader.get(map,""+propertyName);
        }
    };
    this._setupGetterSetterFn(mapGetterSetter, args[1], args[2], args[3]);
} else {
    this._setupProperty(args[0], args[1], args[2]);
}
