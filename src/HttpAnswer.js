const logger = require("./fakeLogger");
var pump = require('pump')

HttpAnswer.prototype.type = function(c_type){
    if(!c_type) {
        return this._headers["content-type"]
    }else{
        this._headers["content-type"] = c_type;
    }
}

HttpAnswer.prototype.length = function(len){
    if(len === undefined) {
        return this._headers["content-length"];
    }else{
        this._headers["content-length"] = len;
    }
}

HttpAnswer.prototype.answered = function(){
    return this._native.finished;
}

HttpAnswer.prototype.skipRest = function(){
    this.leave = true;
}

HttpAnswer.prototype.status = function(code){
    this._statusCode = code;
    //msg && (this._native.statusMessage = msg);
}

HttpAnswer.prototype.getHeader = function(name){
    return this._headers[name.toLowerCase()];
}

/* HttpAnswer.prototype.setCookie = function(val){
    if (this._headers['set-cookie']) {
        this._headers['set-cookie'] = [this._headers['set-cookie']].concat(val);
      } else {
        this._headers['set-cookie'] = val
      }
} */

HttpAnswer.prototype.setHeader = function(name,val){
    name = name.toLowerCase();
    if (this._headers[name] && name === 'set-cookie') {
        this._headers[name] = [this._headers[name]].concat(val);
    } else {
        this._headers[name] = val
    }
}

HttpAnswer.prototype.removeHeader = function(name){
    delete this._headers[name];
}

/**
 * Write if it is not written before
 * @param {*} data 
 * @param {string} type : content-type
 * @param {number|string} length : content-length
 */
HttpAnswer.prototype.write = function(data,type,length, safe){
    if(! (safe && this.data) ) { //Don't set if it is already set
        this.data = data;   
        type && this.type(type);
        length && this.length(length);
    } 
}

/**
 * Serialize -> compress -> set length -> send
 * if data parametre is null, undefined then it'll read data from this.data
 * otherwise it'll overwrite this.data
 
 * @param {string} reason 
 * 
 * @param {number} code 
 * @param {string} reason 
 * 
 * @param {string} type
 * @param {number} length
 * @param {string} reason 
 * 
 * 
 */
HttpAnswer.prototype.end = function(){
    if(this.answered()){
        logger.log.warn("This response has been rejected as client has already been answered. Reason: " + this.answeredReason);
    }else{
        let code,type,length,reason;

        if(typeof arguments[0] === "string" && typeof arguments[1] === "number"){
            type = arguments[0];
            length = arguments[1];
            reason = arguments[2];
        }else if(typeof arguments[0] === "number"){
            this._statusCode = arguments[0];
            reason = arguments[1];
        }else{
            reason = arguments[0];
        }

        this.answeredReason = reason;
        if(this.data === null || this.data === undefined){
            this.data = "";
        }

        type && this.type(type);
        length && this.length(length);
        
        if(isStream(this.data)){
            this._compress(true);
            this._native.writeHead(this._statusCode, this._headers);
            this.eventEmitter.emit("beforeAnswer",this._for,this,true);
            pump(this.data,this._native);
        }else{
            if(this.data instanceof Error){
                logger.log.error(this.data);
                this._statusCode = 500;
                this.length(0);
            }else if(this.data && !this._compress()){
                this._setContentLength();
            }

            this._send(this.data);
        }
        this.eventEmitter.emit("afterAnswer",this._for,this,false);
        logger.log.debug(`Request Id:${this._for.id} has been answered`);
    }
}

HttpAnswer.prototype._compress = function(isItAStream){
    const compressionConfig = this._for.context.route.compress;

    if(compressionConfig){
        let compress;
        if(isItAStream && compressionConfig.filter(this._for, this )  ){
            compress = this.containers.streamCompressors.get(this._for,compressionConfig.preference);
        }else if(this.data.length > 0 
            && this.data.length > compressionConfig.threshold 
            && compressionConfig.filter(this._for,this) ) {
            compress =  this.containers.compressors.get(this._for,compressionConfig.preference);
        }

        if(compress){
            this.eventEmitter.emit("beforeCompress",this._for,this);
            compress(this._for, this);
            this.eventEmitter.emit("afterCompress",this._for,this);

            logger.log.debug(`Request Id:${this._for.id}; answer has been compressed`);
            return true;
            //When data is compressed, Transfer-Encoding →chunked, and content-encoding → compression type. So don't set content length
            //When data is compressed, content-encoding should be set (Eg gzip). Content type should represent the original content only  
        } 
    }

    return false;
}

HttpAnswer.prototype._send = function(data){
    this._native.writeHead(this._statusCode, this._headers);
    this.eventEmitter.emit("beforeAnswer",this._for,this,false);
    this._native.end(data || "",this.encoding);
}

//TODO: test
// Check section https://tools.ietf.org/html/rfc7230#section-3.3.2
// we should not send content-length for status code < 200, 204.
// or status code === 2xx and method === CONNECT
HttpAnswer.prototype._setContentLength = function(){
    if ( !this._headers['content-length'] && !this._headers['transfer-encoding'] ){
        if(this._statusCode < 200 || this._statusCode === 204 || 
            (this._for.method === "CONNECT" && this._statusCode > 199 &&  this._statusCode < 300)) 
        {
            //don't send content length
        }else if( ! this.length() && typeof this.data === 'string' ){
            this.length( this.length( Buffer.byteLength(this.data) ) );
        }
    } 
}

const isStream = function(data){
    return data && data.pipe && typeof data.pipe === "function"
}

HttpAnswer.prototype.redirectTo = function(loc){
    this._headers['location'] = loc;
    this._native.writeHead(302, this._headers);
    this._native.end("");
}

function HttpAnswer(res,asked,containers,eventEmitter){
    this.containers = containers;
    this._for = asked;
    this._native = res;
    this.encoding = "utf-8";
    this._statusCode = 200;
    this._headers = {};
    this.eventEmitter = eventEmitter;
}

module.exports = HttpAnswer;