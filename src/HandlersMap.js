
const Handler = require("./Handler");

HandlersMap.prototype.add = function(name,handler,options){
    if(this.handlers[name]) {
        throw Error("You've already added a handler with same name " + name);
    }else{
        this.handlers[name] = new Handler(name,handler,options);
    }
}

HandlersMap.prototype.removeIfExist = function(name){
    if(this.handlers[name]){
        delete this.handlers[name];
    }
}

HandlersMap.prototype.remove = function(name){
    delete this.handlers[name];
}

HandlersMap.prototype.get = function(name){
    return this.handlers[name];
}

function HandlersMap(){
    this.handlers = {};
}

module.exports = HandlersMap;