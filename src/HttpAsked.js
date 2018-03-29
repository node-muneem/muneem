var url = require('url');

HttpAsked.prototype.toString = ()  => "Request (" + this.id + ") : " + this.url;

function HttpAsked(request,params){
    this.processQueryParam(request);
    this.id = request.id;
    this.params = params;
    this.headers = request.headers;
    this._native = request;
    this.body =[];
    this.contentLength = request.headers['content-length'] || 0;
}

HttpAsked.prototype.processQueryParam = function(request){
    if( request.url.indexOf("?") !== -1 ){
        var parsedURL = url.parse(request.url, true);
        this.url =parsedURL.pathname//without query param
        this.query = parsedURL.query//convert into map
    }
}
module.exports = HttpAsked;