/**
 * 
 * @param {*} asked 
 * @param {HttpAnswer} answer 
 */
exports.handle = function(asked,answer){
    answer.setHeader("rejected", "content length");
    answer.status(413, "request entity too large");
    answer.end();
    asked.nativeRequest.connection.destroy();
}