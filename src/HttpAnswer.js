
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

/* HttpAnswer.prototype.busy = function (msg="I'll talk to you later"){
    this.status(502,msg);
} */

HttpAnswer.prototype.timeOut = function (msg="You're taking more time than expected."){
    this.status(408,msg);
    this.nativeResponse.end();
}
HttpAnswer.prototype.rejectContent = function (msg="I can't handle such big request"){
    this.status(413,msg);
    this.nativeResponse.end();
}
HttpAnswer.prototype.rejectURI = function (msg="I can't handle such big URI"){
    this.status(414,msg);
    this.nativeResponse.end();
}
HttpAnswer.prototype.rejectMimeType = function (msg="I can't handle this media type"){
    this.status(415,msg);
    this.nativeResponse.end();
}
HttpAnswer.prototype.notFound = function (msg="I don't have what you asked for"){
    this.status(404,msg);
    this.nativeResponse.end();
}
HttpAnswer.prototype.badData = function (msg="I can't understand what you are talking about"){//"check it before asking"
    this.status(400,msg);
    this.nativeResponse.end();
}
HttpAnswer.prototype.move = function (msg="I can't help you in this regard anymore"){
    this.status(301,msg);
    this.nativeResponse.end();
}
HttpAnswer.prototype.unauthorized = function (msg="Sorry stranger! you can't go in this way"){
    this.status(401,msg);
    this.nativeResponse.end();
}
HttpAnswer.prototype.forbidden = function (msg="Seems you're not permitted to access this resource currently'"){
    this.status(403,msg);
    this.nativeResponse.end();
}
HttpAnswer.prototype.error = function (msg="Uff! something wrong is going on. I'm working on this"){
    this.status(500,msg);
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