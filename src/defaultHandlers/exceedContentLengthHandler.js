/**
 * 
 * @param {*} asked 
 * @param {HttpAnswer} answer 
 */
module.exports= function(asked,answer){
    answer.setHeader("rejected", "request entity too large");
    answer.close(413, "request entity too large");
    throw Error("request entity is too large");
}