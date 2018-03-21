
exports.handle = function(asked,answer){
    //TODO: custom message is not being set
    answer.status(500,"There is something wrong between us. Please check the request again. So I can respond properly.");
    answer.nativeResponse.end();
}