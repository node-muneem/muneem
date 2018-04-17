const logger = require("./fakeLogger");
var pump = require('pump')

HttpAnswer.prototype.type = function(c_type){
    this.setHeader("content-type", c_type);
}

HttpAnswer.prototype.length = function(len){
    this.setHeader("content-length", len);
}

HttpAnswer.prototype.answered = function(){
    return this._native.finished;
}

HttpAnswer.prototype.skipRest = function(){
    this.leave = true;
}

HttpAnswer.prototype.status = function(code , msg){
    this._native.statusCode = code;
    msg && (this._native.statusMessage = msg);
}

HttpAnswer.prototype.getHeader = function(name){
    return this._native.getHeader(name.toLowerCase());
}

//TODO: lower case the header name before set
//TODO: if name is set-cookie add is array when already exists
HttpAnswer.prototype.setHeader = function(name,val){
    return this._native.setHeader(name.toLowerCase(),val);
}

HttpAnswer.prototype.removeHeader = function(name){
    return this._native.removeHeader(name);
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
    this._native.end();
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
        
        //TODO:
        //const shouldCompress = this._for.context.route.compress && compressConfig.filter(this._for,this);
        const compressionConfig = this._for.context.route.compress;
        if(isStream(this.data)){
            if(compressionConfig && compressionConfig.filter(this._for,this)){
                    const compress =  this.containers.streamCompressors.get(this._for,compressionConfig.preference);
                    compress && compress(this._for, this);
            }
            //this.data.pipe(this._native);
            pump(this.data,this._native);
        }else{
            //TODO: performance improvement scope
            const serialize = this.containers.serializers.get(this._for);
            if(serialize){
                serialize(this._for,this);
            }else if(typeof this.data === "string"){
                if(!this.getHeader('content-type') ) this.setHeader('content-type', 'text/plain');
                Number(this.data);
            }else if(Buffer.isBuffer(this.data) ){
                if(!this.getHeader('content-type') ) this.setHeader('content-type', 'application/octet-stream');
            }else  if(typeof this.data === "number" && !this.getHeader('content-type')){
                this.data += '';
                this.setHeader('content-type', 'text/plain');
            }else{
                this.status(406);
                this._setContentLength(0);
                this._native.end("");
                logger.log.error("Unsupported data type to send : " + typeof this.data);
                return;
            }

            
            if(compressionConfig && compressionConfig.filter(this._for,this)){
                const compress =  this.containers.compressors.get(this._for,compressionConfig.preference);
                compress && compress(this._for, this);

                //TODO: if there are different stratigies to set content length for different compression techniques
                //then below code is invalid
                this._setContentLength(this.data.length);
            }else{
                this._setContentLength(Buffer.byteLength(this.data));
            }
            this._native.end(this.data,this.encoding);
        }
    }
}

//TODO: test
// Check section https://tools.ietf.org/html/rfc7230#section-3.3.2
// we should not send content-length for status code < 200, 204.
// or status code === 2xx and method === CONNECT
HttpAnswer.prototype._setContentLength = function(len){
    if (!this.getHeader('content-length') && !this.getHeader('transfer-encoding')){
        const statusCode = this._native.statusCode;
        if(statusCode < 200 || statusCode === 204 || 
            (this._for.method === "CONNECT" && statusCode > 199 &&  statusCode < 300)) 
        {
            //don't send content length
        }else{
            this.setHeader('content-length', len);
        }
    } 

}
const isStream = function(data){
    return data && data.pipe && typeof data.pipe === "function"
}

HttpAnswer.prototype.redirectTo = function(loc){
    this._native.writeHead(302, {  'location': loc  });
    this._native.end();
}

function HttpAnswer(res,asked,containers){
    this.containers = containers;
    this._for = asked;
    this._native = res;
    this.encoding = "utf8";
    this._native.statusCode = 200;
}

module.exports = HttpAnswer;