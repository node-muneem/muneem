var http = require('http');
var uniqid = require('uniqid');

Server.prototype.start = function(){
    const eventEmitter = this.eventEmitter 
    const options = this.options;

    this.server.listen(options.port,options.host, function(){
        eventEmitter.emit('onServerStart');
        console.log("Cool DOWN server is UP: http://" + options.host + ":" + options.port);
    });
}

Server.prototype.close = function(){
    this.server.close();
}

function networkErrHandler(err,port,host,server) {
	let msg;
	switch (err.code) {
	    case 'EACCES':
	      msg = 'EACCES: Permission denied to use port ' + port;
	      break;
	    case 'EADDRINUSE':
	      msg = 'EADDRINUSE: Port ' + port + ' is already in use.';
	      break;
		case 'ENOTFOUND':
	      msg = err.code + 'EADDRNOTAVAILD: Host "' + host + '" is not available.';
	      break;
	    default:
	      msg = err.message;
    }
    server.unref();
    console.error(msg);
}

const defaultOptions = {
    port : 3002,
    host : "0.0.0.0",
    generateUniqueReqId : false
}
function Server(options,requestResponseHandler,eventEmitter){
    this.options = Object.assign({},defaultOptions,options);
    var reqId = () => {};
    if(typeof this.options.generateUniqueReqId === "function"){
        reqId = this.options.generateUniqueReqId;
    }else if(this.options.generateUniqueReqId === true){
        reqId = uniqid;
    }
    options = this.options;
    this.eventEmitter = eventEmitter;

    const httpHandler = (req,res) => {
        req.id = reqId();
        requestResponseHandler.lookup(req,res);
    };

    if (this.options.http2) {
        if(this.options.https){
            this.server = require('http2').createSecureServer(this.options.https, httpHandler)
        }else{
            this.server = require('http2').createServer(httpHandler)
        }
    } else {
        if(this.options.https){
            this.server = require('https').createServer(this.options.https,httpHandler);
        }else{
            this.server = require('http').createServer(httpHandler);
        }
    }

    const sLocal = this.server;
    //this.server.on('request', requestResponseHandler);
    this.server.on('error', function(err){
		eventEmitter.emit('onServerError');
		networkErrHandler(err,options.port,options.host,sLocal);
	});
}

module.exports = Server;