
HttpAnswer.prototype.type = function(c_type){
    this.setHeader("content-type", c_type);
}

/**
 * Set cookie value
 * @param {string} val 
 */
HttpAnswer.prototype.setCookie = function(val){
    this.nativeResponse.getHeader("Set-Cookie",val);
}

HttpAnswer.prototype.cookie = function(){
    return this.nativeResponse.getHeader("cookie");
}

HttpAnswer.prototype.answered = function(){
    return this.nativeResponse.finished;
}

HttpAnswer.prototype.status = function(code , msg){
    this.nativeResponse.statusCode = code;
    msg && (this.nativeResponse.statusMessage = msg);
}

HttpAnswer.prototype.getHeader = function(name){
    return this.nativeResponse.getHeader(name);
}

HttpAnswer.prototype.setHeader = function(name){
    return this.nativeResponse.setHeader(name);
}

HttpAnswer.prototype.write = function(data){
    this.data = data;
}

/**
 * @param {string} data 
 */
HttpAnswer.prototype.end = function(data){
    data = data || this.data || "";
    if (!this.nativeResponse.getHeader('Content-Length') || !this.nativeResponse.getHeader('content-length')) {
        this.nativeResponse.setHeader('Content-Length', '' + Buffer.byteLength(data));
    }
    this.nativeResponse.end(data,this.encoding);
}

HttpAnswer.prototype.redirectTo = function(loc){
    this.nativeResponse.writeHead(302, {  'Location': loc  });
    this.nativeResponse.end();
}

function HttpAnswer(res){
    this.nativeResponse = res;
    this.encoding = "utf8";
    this.nativeResponse.statusCode = 200;
}

module.exports = HttpAnswer;