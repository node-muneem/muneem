
HttpAnswer.prototype.type = function(c_type){
    this.setHeader("content-type", c_type);
}

/* HttpAnswer.prototype.cookie = function(oc){
    return this.nativeResponse.finished;
} */

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
    this.nativeResponse.writeHead(302, {
        'Location': loc
    });
    this.nativeResponse.end();
}

/* ans.busy("I'll talk to you later");
ans.reject("I can't handle it");
ans.reply("I've just finished my work")
ans.notFound("I don't have what you asked for")
ans.badData("I can't understand")
//ans.badData("check it before asking")
ans.redirect("I know someone who can help you")
ans.move("I can't help you in this regard anymore")
ans.unauthorized("Sorry stranger! you can't come in this way")
ans.forbidden("") */




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