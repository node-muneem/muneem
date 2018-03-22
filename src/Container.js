
const logger = require('./fakeLogger');

Container.prototype.add = function(name,handler){
    if(this.collection[name]) {
        logger.log.warn(name + " handler have replaced old mapping");
    }
    this.collection[name] = handler;
    return this.collection[name];
}

/* HandlersMap.prototype.removeIfExist = function(name){
    if(this.collection[name]){
        delete this.collection[name];
    }
}

HandlersMap.prototype.remove = function(name){
    delete this.collection[name];
} */

Container.prototype.get = function(name){
    return this.collection[name];
}

function Container(){
    this.collection = {};
}

module.exports = Container;