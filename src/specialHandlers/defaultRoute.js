
exports.handle = function(asked,answer){
    answer.status(500,"There is something wrong. Please check the request URL and method again. So I can respond properly.");
    answer.end();
}