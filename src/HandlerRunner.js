const logger = require("./fakeLogger");

Runner.prototype.runNonStreamHandler = function(asked,answer,context){
    if(this.before){
        logger.log.debug(asked,"Executing before of " + this.handler.name);
        callAll(this.before,asked,context,this.handler.name);
    }
    
    logger.log.debug(asked,"Executing handler " + this.handler.name);
    this.handler.handle(asked,answer,context);
    
    if(this.after){
        logger.log.debug(asked,"Executing after of " + this.handler.name);
        callAll(this.before,asked,context,this.handler.name);
    }
}

Runner.prototype.runStreamHandler = function(asked, answer, context, chunk){
    if(this.before){
        logger.log.debug(asked,"Executing before of " + this.handler.name);
        callAll(this.before,asked,context,this.handler.name);
    }

    this.handler.handle(chunk);
    
    if(this.after){
        logger.log.debug(asked,"Executing after of " + this.handler.name);
        callAll(this.before,asked,context,this.handler.name);
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
    if(!handler.isParallen){
        this.before = before;
        this.after = after;
    }
}

module.exports = Runner;