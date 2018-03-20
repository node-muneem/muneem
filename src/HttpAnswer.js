
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
    msg || (this.nativeResponse.statusMessage = msg);
}

HttpAnswer.prototype.write = function(data){
    this.data = data;
}

HttpAnswer.prototype.redirectTo = function(loc){
    this.nativeResponse.writeHead(302, {  'Location': loc  });
    this.nativeResponse.end();
}

function HttpAnswer(res){
    this.nativeResponse = res;

    this.getHeaders = res.getHeaders;
    this.getHeader = res.getHeader;
    this.getHeaderNames = res.getHeaderNames;
    this.hasHeader = res.hasHeader;
    this.removeHeader = res.removeHeader;
    this.setHeader = res.setHeader;
    
    this.encoding = "utf8";
    this.nativeResponse.statusCode = 200;
    //this.stream
    //this.data
}

module.exports = HttpAnswer;