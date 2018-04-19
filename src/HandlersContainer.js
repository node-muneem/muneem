const ApplicationSetupError = require("./ApplicationSetupError");
const logger = require('./fakeLogger');

class HandlersContainer {
    constructor(methodName){
        this.collection = {};
        this.methodName = methodName || "handle";
    }

    add(name,handler){

        if(this.collection[name]) {
            logger.log.warn(name + " have replaced old mapping");
        }

        if(typeof handler === "function"){
            this.collection[name] = handler;
        }else if(typeof handler[this.methodName] === "function"){
            this.collection[name] = handler[this.methodName];
        }else{
            throw new ApplicationSetupError(`Handler should be a function or an object with '${this.methodName}' method`);
        }

        return this;
    }

    get(name){
        return this.collection[name];
    }
}

module.exports = HandlersContainer;