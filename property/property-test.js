


var map = new SimpleMap({name: "Manuel"});

var prop = new PropertyObservable(map, "name");


prop.get() //-> "Manuel"

prop.set("Justin")

map.get("name") //-> "Justin"


PropertyObservable = function(map, property){

}
