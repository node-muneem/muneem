
HttpAnswer.prototype.type = function(c_type){
    this.setHeader("content-type", c_type);
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

HttpAnswer.prototype.write = function(data){
    this.data = data;
}

/**
 * @param {string} data 
 */
HttpAnswer.prototype.end = function(data,reason){
    if(this.answered()){
        throw ApplicationError("This response has been rejected as client has already been answered. Reason: " + this.answeredReason);
    }else{
        /* this.answeredBy = arguments.callee; //TODO: test it*/
        this.answeredReason = reason; //TODO: test it 
        data = data || this.data || "";
        if (!this._native.getHeader('content-length')) {
            this._native.setHeader('content-length', '' + Buffer.byteLength(data));
        }
        this._native.end(data,this.encoding);
    }
}

HttpAnswer.prototype.redirectTo = function(loc){
    this._native.writeHead(302, {  'Location': loc  });
    this._native.end();
}

function HttpAnswer(res){
    this._native = res;
    this.encoding = "utf8";
    this._native.statusCode = 200;
}

module.exports = HttpAnswer;