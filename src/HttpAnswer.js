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
    return this._native.getHeader(name);
}

HttpAnswer.prototype.setHeader = function(name,val){
    return this._native.setHeader(name,val);
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
        //writeMore("abc"), writeMore("def"), end("ghi")
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
            if(typeof this.data === "string" || Buffer.isBuffer(this.data)){
                //do nothing
            }else  if(typeof this.data === "number"){
                this.data += '';
            }else if(typeof this.data === "object"){
                const serialize = this.containers.serializers.get(this._for);
                serialize && serialize(this._for,this);//serialize data
            }else{
                throw Error("Unsupported data type to send : " + typeof this.data);
            }

            
            if(compressionConfig && compressionConfig.filter(this._for,this)){
                const compress =  this.containers.compressors.get(this._for,compressionConfig.preference);
                compress && compress(this._for, this);

                //TODO: if there are different stratigies to set content length for different compression techniques
                //then below code is invalid
                if (!this.getHeader('content-length')) {
                    this.setHeader('content-length', this.data.length);
                }
            }else{
                if (!this.getHeader('content-length')) {
                    this.setHeader('content-length', Buffer.byteLength(this.data));
                }
            }
            this._native.end(this.data,this.encoding);
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