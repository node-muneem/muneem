/**
 * 
 * @param {*} asked 
 * @param {HttpAnswer} answer 
 */
exports.handle = function(asked,answer){
    answer.setHeader("rejected", "content length");
    answer.nativeResponse.end();
    asked.nativeRequest.connection.destroy();
}