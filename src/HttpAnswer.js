const logger = require("./fakeLogger");

HttpAnswer.prototype.type = function(c_type){
    this.setHeader("content-type", c_type);
}

HttpAnswer.prototype.length = function(len){
    this.setHeader("content-length", len);
}

/* HttpAnswer.prototype.setCookie = function(val){
    this._native.setHeader("set-cookie",val);
}

HttpAnswer.prototype.cookie = function(){
    return this._native.getHeader("cookie");
}
 */
HttpAnswer.prototype.answered = function(){
    return this._native.finished;
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
 * @param {string} type : content-type
 * @param {number|string} length : content-length
 */
HttpAnswer.prototype.writeMore = function(data,type,length){
    type && this.type(type);
    length && this.length(length);

    if(!data){
        //logger.log.warn("I hope you know what you are doing. Data given to Answer.writeMore is empty")
        return;
    }else{
        if(this.data){
            if(typeof this.data === "string" && typeof data === "string"){
                    this.data += data;
            }else if(isStream(this.data) && isStream(data)){
                    this.data.pipe(data);
            }else{
                this.close("Unsupported type " + typeof data + " is given");
                throw Error("Unsupported type " + typeof data + ". writeMore method supports only string and stream");
            }
        }else{
            this.data = data;
        }
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

HttpAnswer.prototype.end = function(data,reason){
    
    if(this.answered()){
        logger.log.warn("This response has been rejected as client has already been answered. Reason: " + this.answeredReason);
    }else{
        let data,type,length,reason;
        if(arguments.length < 3){
            data = arguments[0];
            reason = arguments[1];
        }else{
            data = arguments[0];
            type = arguments[1];
            length = arguments[2];
            reason = arguments[3];
        }
        
        this.answeredReason = reason;
        data = data || this.data || "";
        type && this.type(type);
        length && this.length(length);
        
        if(isStream(data)){
            data.pipe(this._native);
        }else{
            if(typeof data === "string" || Buffer.isBuffer(data)){
            }else if(typeof data === "object" || typeof data === "number"){
                data = JSON.stringify(data);
            }else{
                throw Error("Unsupported data type to send : " + typeof data);
            }
            if (!this._native.getHeader('content-length')) {
                this._native.setHeader('content-length', Buffer.byteLength(data));
            }

            /* if (!this._native.getHeader('content-type')) {
                this._native.setHeader('content-type', '' + Buffer.byteLength(data));
            } */
            this._native.end(data,this.encoding);
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

function HttpAnswer(res){
    this._native = res;
    this.encoding = "utf8";
    this._native.statusCode = 200;
}

module.exports = HttpAnswer;