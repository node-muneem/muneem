const logger = require("./fakeLogger");

Runner.prototype.runNonStreamHandler = function(asked,answer,context){
    this.runBefore(asked, context);
    
    logger.log.debug("Request" + asked.id + "Executing handler " + this.handler.name);
    this.handler.handle(asked,answer,context);
    
    this.runAfter(asked, context);
}

Runner.prototype.runStreamHandler = function(asked, answer, context, chunk){
    //this.runBefore(asked, context);
    this.handler.handle(chunk);
    
    //this.runAfter(asked, context);
}

Runner.prototype.runBefore = function(asked, context) {
    if(this.before){
        logger.log.debug(asked,"Executing before of " + this.handler.name);
        callAll(this.before,asked,context,this.handler.name);
    }
}

Runner.prototype.runAfter = function(asked, context) {
    if(this.after){
        logger.log.debug(asked,"Executing after of " + this.handler.name);
        callAll(this.after,asked,context,this.handler.name);
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