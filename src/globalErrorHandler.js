const ApplicationSetupError = require('./ApplicationSetupError');
const logger = require("./fakeLogger");

process.on('uncaughtException', function(err) {
    if(err instanceof ApplicationSetupError){
        logger.log.fatal(err);
        console.log(err);
        process.exit(1);
    }else{
        //TODO: it doesn't close connection
        console.log(err);
        logger.log.error(err);
    }
})