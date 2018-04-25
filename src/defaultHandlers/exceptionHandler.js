const logger = require("./../fakeLogger");


exports.handle = function(asked,answer){
    const error = answer.error;
    answer.end(500,error.msg || "Internal Server Error");
    logger.log.error(error,asked.route);
}