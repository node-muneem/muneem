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
    this.contentLength = request.headers['content-length'] && Number(request.headers['content-length']) || -1;
}

HttpAsked.prototype.readBody = async function(){
    if(!this._hasBody || this.contentLength === 0) return;
    else if(this.body && this.body.length > 0) return this.body;
    else{
        this.body = [];
        await new Promise((resolve, reject) => {
            this.stream.on('data', (chunk)=>this.body.push(chunk));
            this.stream.on('end', ()=>{
                this.body = Buffer.concat(this.body); 
                resolve(this.body)
            });
            this.stream.on('error', reject); // or something like that
        });

        return this.body
    }
}

HttpAsked.prototype.processQueryParam = function(){
    if( this._native.url.indexOf("?") !== -1 ){
        var parsedURL = url.parse(this._native.url, true);
        this.url =parsedURL.pathname//without query param
        this.query = parsedURL.query//convert into map
    }
}


module.exports = HttpAsked;