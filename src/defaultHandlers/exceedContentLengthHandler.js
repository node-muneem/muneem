/**
 * 
 * @param {*} asked 
 * @param {HttpAnswer} answer 
 */
module.exports= function(asked,answer){
    answer.setHeader("rejected", "request entity too large");
    answer.end(413,"request entity too large");
}