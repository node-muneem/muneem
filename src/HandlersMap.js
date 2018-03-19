
const Handler = require("./Handler");

HandlersMap.prototype.add = function(name,handler,options){
    if(this.handlers[name]) {
        //TODO: logger
        console.log(name + " handler have replaced old mapping");
    }else{
        this.handlers[name] = new Handler(handler,options);
        return this.handlers[name];
    }
}

/* HandlersMap.prototype.removeIfExist = function(name){
    if(this.handlers[name]){
        delete this.handlers[name];
    }
}

HandlersMap.prototype.remove = function(name){
    delete this.handlers[name];
} */

HandlersMap.prototype.get = function(name){
    return this.handlers[name];
}

function HandlersMap(){
    this.handlers = {};
}

module.exports = HandlersMap;