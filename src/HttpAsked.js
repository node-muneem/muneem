var url = require('url');

HttpAsked.prototype.toString = ()  => "Request (" + this.id + ") : " + this.url;

function HttpAsked(request,params){
    this.processQueryParam(request);
    this.id = request.id;
    this.params = params;
    this.nativeRequest = request;
    this.body =[]
}

 //Constructing query param will slow down throughput by .4-.5k rps
 HttpAsked.prototype.processQueryParam = function(request){
    if( request.url.indexOf("?") !== -1 ){
        var parsedURL = url.parse(request.url, true);
        this.url =parsedURL.pathname//without query param
        this.query = parsedURL.query//convert into map
    }
}
module.exports = HttpAsked;