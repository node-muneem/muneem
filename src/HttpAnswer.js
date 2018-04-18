const logger = require("./fakeLogger");
var pump = require('pump')

HttpAnswer.prototype.type = function(c_type){
    this._headers["content-type"] = c_type;
}

HttpAnswer.prototype.length = function(len){
    this._headers["content-length"] = len;
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

//TODO: test
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
 * Add more string data to previously added data. Or pipe the stream to previously added stream
 * Or set data if it is not set before.
 * @param {*} data 
 */
HttpAnswer.prototype.writeMore = function(data){
    if(this.data){
        if(typeof this.data === "string" && typeof data === "string"){
                this.data += data;
        }else if(isStream(this.data) && isStream(data)){
                //this.data.pipe(data);
                pump(this.data,data);
                this.data = data;
        }else{
            this.close("Unsupported type " + typeof data + " is given");
            throw Error("Unsupported type " + typeof data + ".");
        }
    }else{
        this.data = data;
    }
}

/**
 * Write if it is not written before
 * @param {*} data 
 * @param {string} type : content-type
 * @param {number|string} length : content-length
 */
HttpAnswer.prototype.write = function(data,type,length){
    if(!this.data) { //Don't set if it is already set
        this.data = data;   
        type && this.type(type);
        length && this.length(length);
    } 
}

/**
 * Replace previous data with new
 * @param {*} data 
 * @param {string} type : content-type
 * @param {number|string} length : content-length
 */
HttpAnswer.prototype.replace = function(data,type,length){
    this.data = data;
    type && this.type(type);
    length && this.length(length);
}

/**
 * Close and send the response with reason. It'll be logged when you try to send response again.
 * @param {string} reason 
 */
HttpAnswer.prototype.close = function(reason){
    this.answeredReason = reason;
    this._native.writeHead(this._statusCode, this._headers);
    this._native.end("",this.encoding);
    //logger.log.debug("response stream has been closed");
    logger.log.debug(`Request Id:${this._for.id},response stream has been closed`);
}

HttpAnswer.prototype.applyTransferEncodingOnStream = a => a;
HttpAnswer.prototype.applyTransferEncoding = a => a;

HttpAnswer.prototype.end = function(){
    if(this.answered()){
        logger.log.warn("This response has been rejected as client has already been answered. Reason: " + this.answeredReason);
    }else{
        let data,type,length,reason;
        if(arguments.length === 2){
            data = arguments[0];
            reason = arguments[1];
        }else{
            data = arguments[0];
            type = arguments[1];
            length = arguments[2];
            reason = arguments[3];
        }
        
        this.answeredReason = reason;
        this.data = data || this.data || "";
        type && this.type(type);
        length && this.length(length);
        
        const compressionConfig = this._for.context.route.compress;
        if(isStream(this.data)){
            if(compressionConfig && compressionConfig.filter(this._for,this)){
                    const compress =  this.containers.streamCompressors.get(this._for,compressionConfig.preference);
                    compress && compress(this._for, this);
            }
            this._native.writeHead(this._statusCode, this._headers);
            //this.data.pipe(this._native);
            pump(this.data,this._native);
            logger.log.debug(`Request Id:${this._for.id} has been answered as stream`);
        }else{
            //TODO: performance improvement scope
            const serialize = this.containers.serializers.get(this._for);
            if(serialize){
                serialize(this._for,this);
            }else if(typeof this.data === "string"){
                if( !this._headers['content-type'] ) this.type('text/plain');
                Number(this.data);
            }else if(Buffer.isBuffer(this.data) ){
                if( !this._headers['content-type'] ) this.type('application/octet-stream');
            }else  if(typeof this.data === "number" && !this._headers['content-type'] ){
                this.data += '';
                this.type('text/plain');
            }else{
                this._setContentLength(0);
                this._native.writeHead(406, this._headers);
                this._native.end("");
                //logger.log.error("Unsupported data type to send : " + typeof this.data);
                logger.log.debug(`Request Id:${this._for.id}; Unsupported data type to send :  ${typeof this.data}`);
                return;
            }

            if(compressionConfig && compressionConfig.threshold <= this.data.length && compressionConfig.filter(this._for,this)){
                const compress =  this.containers.compressors.get(this._for,compressionConfig.preference);
                if(compress){
                    compress(this._for, this);
                    //Transfer-Encoding →chunked
                    //content-encoding →gzip
                    //this._setContentLength(this.data.length);//Don't send content length
                    logger.log.debug(`Request Id:${this._for.id}; answer has been compressed`);
                }
                
            }else{
                this._setContentLength(Buffer.byteLength(this.data));
            }
            this._native.writeHead(this._statusCode, this._headers);
            this._native.end(this.data,this.encoding);
            logger.log.debug(`Request Id:${this._for.id} has been answered`);
            //TODO: Even afterSend
        }
    }
}

//TODO: test
// Check section https://tools.ietf.org/html/rfc7230#section-3.3.2
// we should not send content-length for status code < 200, 204.
// or status code === 2xx and method === CONNECT
HttpAnswer.prototype._setContentLength = function(len){
    if ( !this._headers['content-length'] && !this._headers['transfer-encoding'] ){
        if(this._statusCode < 200 || this._statusCode === 204 || 
            (this._for.method === "CONNECT" && this._statusCode > 199 &&  this._statusCode < 300)) 
        {
            //don't send content length
        }else{
            this.length(len);
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

function HttpAnswer(res,asked,containers){
    this.containers = containers;
    this._for = asked;
    this._native = res;
    this.encoding = "utf8";
    this._statusCode = 200;
    this._headers = {};
}

module.exports = HttpAnswer;