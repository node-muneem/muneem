const logger = require("./fakeLogger");

Runner.prototype.runNonStreamHandler = function(asked,answer){
    this.runBefore(asked);
    
    logger.log.debug("Request" + asked.id + "Executing handler " + this.handler.name);
    this.handler.handle(asked,answer);
    
    this.runAfter(asked);
}

Runner.prototype.runStreamHandler = function(asked, answer, chunk){
    //this.runBefore(asked);
    this.handler.handle(chunk);
    
    //this.runAfter(asked);
}

Runner.prototype.runBefore = function(asked) {
    if(this.before){
        logger.log.debug(asked,"Executing before of " + this.handler.name);
        callAll(this.before,asked,this.handler.name);
    }
}

Runner.prototype.runAfter = function(asked) {
    if(this.after){
        logger.log.debug(asked,"Executing after of " + this.handler.name);
        callAll(this.after,asked,this.handler.name);
    }
}

/**
 * 
 * @param {Array} arrayOfFunctions 
 */
function callAll(arrayOfFunctions, ...args){
    for(let i=0; i < arrayOfFunctions.length; i++){
        arrayOfFunctions[i](...args);
    }
}

/**
 * 
 * @param {*} handler 
 * @param {Array} before 
 * @param {Array} after 
 */
function Runner(handler,before,after){
    this.handler = handler;
    if(!handler.inParallel){
        if(before && Array.isArray(before) && before.length > 0)
            this.before = before;
            
        if(after && Array.isArray(after) && after.length > 0)
            this.after = after;
    }
}

module.exports = Runner;