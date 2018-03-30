/**
 * 
 * @param {*} asked 
 * @param {HttpAnswer} answer 
 */
exports.handle = function(asked,answer){
    answer.setHeader("rejected", "request entity too large");
    answer.status(413, "request entity too large");
    answer.close("request entity too large");
}