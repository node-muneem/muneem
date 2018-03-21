class ExtendableError extends Error {
    constructor(message) {
      super(message);
      this.name = this.constructor.name;
      if (typeof Error.captureStackTrace === 'function') {
        Error.captureStackTrace(this, this.constructor);
      } else { 
        this.stack = (new Error(message)).stack; 
      }
    }
}   
  
class ApplicationSetupError extends Error {
    constructor(message) {
        super(message);
    }
} 

module.exports = ApplicationSetupError;

const log = require('./muneem').log;

process.on('uncaughtException', function(err) {
    if(err instanceof ApplicationSetupError){
        log.fatal(err);
        console.log(err);
        process.exit(1);
    }else{
        log.error(err);
    }
})