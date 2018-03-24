var url = require('url');

HttpAsked.prototype.toString = ()  => "Request (" + this.id + ") : " + this.url;

function HttpAsked(request,params){
    this.id = request.id,
    //Constructing query param will slow down throughput by .4-.5k rps
    //var parsedURL = url.parse(request.url, true);
    //this.url =parsedURL.pathname,//without query param
    //this.query = parsedURL.query,//convert into map
    this.params = params,
    this.nativeRequest = request,
    this.body =[]
}

module.exports = HttpAsked;