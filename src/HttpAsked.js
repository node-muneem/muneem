var url = require('url');


function HttpAsked(request,params){
    this.id = request.id;
    this.params = params;
    this.headers = request.headers;
    this._native = request;
    this.stream = request;
    this.body =[];
    this.path = this._native._path;
    this.queryStr = this._native._queryStr;
    this.hashStr = this._native._hashStr;

    if(request.headers['content-length'] !== undefined){
        this.contentLength = Number(request.headers['content-length']);
    }else{
        this.contentLength =  -1;
    }
}

HttpAsked.prototype.readBody = async function(){
    if(this._mayHaveBody === false || this.contentLength === 0) return;
    else if(this.body && this.body.length > 0) return this.body;
    else{
        this.body = [];
        await new Promise((resolve, reject) => {
            this.stream.on('data', (chunk)=>this.body.push(chunk));
            this.stream.on('end', ()=>{
                this.body = Buffer.concat(this.body); 
                resolve(this.body)
            });
            this.stream.on('error', (err) => {
                reject(err);
                throw Error("Error in reading request stream");
            });
        });

        return this.body
    }
}

module.exports = HttpAsked;