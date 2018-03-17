
HttpAnswer.prototype.type = function(c_type){
    this.setHeader("content-type", c_type);
}

/* HttpAnswer.prototype.cookie = function(oc){
    return this.nativeResponse.finished;
} */

HttpAnswer.prototype.sent = function(){
    return this.nativeResponse.finished;
}

HttpAnswer.prototype.status = function(code , msg){
    this.nativeResponse.statusCode = code;
    msg || (this.nativeResponse.statusMessage = msg);
}

HttpAnswer.prototype.redirectTo = function(loc){
    this.nativeResponse.writeHead(302, {
        'Location': loc
    });
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
    //this.stream
    //this.data
}

module.exports = HttpAnswer;