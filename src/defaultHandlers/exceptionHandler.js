const logger = require("./../fakeLogger");

module.exports = function(error, asked,answer){
    answer.close(500, (error && error.msg) || "Internal Server Error");
    logger.log.error(error, asked.route);
}