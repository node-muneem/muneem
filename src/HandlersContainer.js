const ApplicationSetupError = require("./ApplicationSetupError");
const logger = require('./fakeLogger');

class HandlersContainer {
    constructor(){
        this.collection = {};
    }

    add(name,handler,methodName){

        if(this.collection[name]) {
            logger.log.warn(name + " handler have replaced old mapping");
        }

        methodName = methodName || "handle";
        if(typeof handler === "function"){
            this.collection[name] = handler;
        }else if(typeof handler[methodName] === "function"){
            this.collection[name] = handler[methodName];
        }else{
            throw new ApplicationSetupError("Handler should be a function or an object with 'handle' method");
        }

        return this;
    }

    get(name){
        return this.collection[name];
    }
}

module.exports = HandlersContainer;