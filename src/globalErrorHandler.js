const ApplicationSetupError = require('./ApplicationSetupError');
const logger = require("./fakeLogger");

process.on('uncaughtException', function(err) {
    if(err instanceof ApplicationSetupError){
        logger.log.fatal(err);
        process.exit(1);
    }else{
        logger.log.error(err);
    }
})