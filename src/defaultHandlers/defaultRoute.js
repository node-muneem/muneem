
exports.handle = function(asked,answer){
    answer.status(500);
    answer.close("route was not found");
}