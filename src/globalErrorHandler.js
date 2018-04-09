const ApplicationSetupError = require('./ApplicationSetupError');
const logger = require("./fakeLogger");

process.on('uncaughtException', function(err) {
    if(err instanceof ApplicationSetupError){
        logger.log.fatal(err);
        console.error(err);
        process.exit(1);
    }else{
        logger.log.error(err);
    }
})

process.on('unhandledRejection', (reason, p) => {
    logger.log.error(reason, 'Unhandled Rejection at Promise', p);
});