var url = require('url');

HttpAsked.prototype.toString = ()  => "Request (" + this.id + ") : " + this.url;

function HttpAsked(request,params,context){
    this.id = request.id;
    this.params = params;
    this.headers = request.headers;
    this._native = request;
    this.context = context;
    this.body =[];
    this.processQueryParam(request);
    this.contentLength = request.headers['content-length'] || 0;
}

HttpAsked.prototype.readBody = async function(){
    //TODO: what if the function is called multiple times 
    // or the body has already been read
    // or there is no body to read (content-length === '0', method === "GET|HEAD")

    this.body = [];
    await new Promise(function(resolve, reject) {
        this._native.on('data', (chunk)=>this.body.push(chunk));
        this._native.on('end', ()=>{
            this.body = Buffer.concat(this.body); 
            resolve(this.body)
        });
        this._native.on('error', reject); // or something like that
    });

    return this.body
}

HttpAsked.prototype.processQueryParam = function(){
    if( this._native.url.indexOf("?") !== -1 ){
        var parsedURL = url.parse(this._native.url, true);
        this.url =parsedURL.pathname//without query param
        this.query = parsedURL.query//convert into map
    }
}


module.exports = HttpAsked;