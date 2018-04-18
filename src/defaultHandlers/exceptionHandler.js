const logger = require("./../fakeLogger");


exports.handle = function(asked,answer){
    const error = answer.error;
    answer.status(500);
    answer.close("Internal Server Error");
    logger.log.error(error,asked.route);
}