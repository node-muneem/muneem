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
            this.end(null,500,"Unsupported type " + typeof data + " is given");
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
        
        const compressionConfig = this._for.context.route.compress;
        if(isStream(this.data)){
            if(compressionConfig && compressionConfig.filter(this._for,this)){
                    const compress =  this.containers.streamCompressors.get(this._for,compressionConfig.preference);
                    if(compress){
                        this.eventEmitter.emit("beforeCompress",this._for,this);
                        compress(this._for, this);
                        this.eventEmitter.emit("afterCompress",this._for,this);  
                    } 
            }
            this._native.writeHead(this._statusCode, this._headers);
            this.eventEmitter.emit("beforeAnswer",this._for,this,true);
            pump(this.data,this._native);
            this.eventEmitter.emit("afterAnswer",this._for,this,true);
            logger.log.debug(`Request Id:${this._for.id} has been answered as stream`);
        }else{
            if(this.data instanceof Error){
                logger.log.error(this.data);
                this._statusCode = 500;
                this.length(0);
            }else if(this.data){
                this.eventEmitter.emit("beforeSerialize",this._for,this);
                if(this._serialize() === false) return;
                this.eventEmitter.emit("afterSerialize",this._for,this);
    
                if(compressionConfig && this.data.length > 0 && this.data.length > compressionConfig.threshold && compressionConfig.filter(this._for,this)){
                    const compress =  this.containers.compressors.get(this._for,compressionConfig.preference);
                    if(compress){
                        this.eventEmitter.emit("beforeCompress",this._for,this);
                        compress(this._for, this);
                        this.eventEmitter.emit("afterCompress",this._for,this);
                        //When data is compressed, Transfer-Encoding →chunked, and content-encoding → compression type. So don't set content length
                        logger.log.debug(`Request Id:${this._for.id}; answer has been compressed`);
                    }
                    
                }else{
                    this._setContentLength(Buffer.byteLength(this.data));
                }
            }else {
                //this.length(0);
            }

            this._send(this.data);
        }
    }
}


HttpAnswer.prototype._serialize = function(){
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
        logger.log.debug(`Request Id:${this._for.id}; Unsupported data type to send :  ${typeof this.data}`);
        this.length(0);
        this._send("", 406)
        return false;
    }
    return true;
}
HttpAnswer.prototype._send = function(data, statusCode){
    this._native.writeHead(statusCode || this._statusCode, this._headers);
    this.eventEmitter.emit("beforeAnswer",this._for,this,false);
    this._native.end(data || "",this.encoding);
    this.eventEmitter.emit("afterAnswer",this._for,this,false);
    logger.log.debug(`Request Id:${this._for.id} has been answered`);
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

function HttpAnswer(res,asked,containers,eventEmitter){
    this.containers = containers;
    this._for = asked;
    this._native = res;
    this.encoding = "utf8";
    this._statusCode = 200;
    this._headers = {};
    this.eventEmitter = eventEmitter;
}

module.exports = HttpAnswer;