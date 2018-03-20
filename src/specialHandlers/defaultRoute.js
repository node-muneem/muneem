
exports.handle = function(asked,answer){
    answer.status(500,"There is something wrong between us. Please check the request again. So I can respond properly.");
    answer.nativeResponse.end();
}