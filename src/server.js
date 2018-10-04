var http = require('http');

Server.prototype.start = function(){
    this.eventEmitter.emit('beforeServerStart', {
        host : this.options.host,
        port: this.options.port,
        http2 : this.options.http2,
        https : this.secure
    });
    this.server.listen(this.options.port, this.options.host, () => {
        this.eventEmitter.emit('afterServerStart');
        console.log("Cool DOWN server is UP on host " + this.options.host + " at port " + this.options.port);
    });
}

/* const events = {
    "b_close" : [],
    "a_close" : [],
    "error" : [],
    "b_start" : [],
    "a_start" : [],
    "request" : []
}
Server.prototype.on = function(eventName, fn){
    events[eventName].push(fn);
}

Server.prototype.emit = function(eventName){
    events[eventName].push(fn);
} */

Server.prototype.close = function(){
    this.eventEmitter.emit('serverClose');
    this.server.close();
    this.eventEmitter.emit('afterServerClose');

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
    requestId : false
}
function Server(options, requestResponseHandler, eventEmitter){
    this.options = Object.assign({},defaultOptions,options);
    var reqId = () => {};
    if(typeof this.options.requestId === "function"){
        reqId = this.options.requestId;
    }else if(this.options.requestId === true){
        //reqId = () => Date.now();
        reqId = Date.now;
    }
    options = this.options;
    this.eventEmitter = eventEmitter;

    const httpHandler = (req,res) => {
        req.id = reqId();
        this.eventEmitter.emit('request', req,res);
        requestResponseHandler.lookup(req,res);
    };

    if (this.options.http2) {
        if(this.options.https){
            this.server = http2().createSecureServer(this.options.https, httpHandler)
        }else{
            this.server = http2().createServer(httpHandler)
        }
    } else {
        if(this.options.https){
            this.secure = true;
            this.server = require('https').createServer(this.options.https,httpHandler);
        }else{
            this.server = require('http').createServer(httpHandler);
        }
    }

    //Will skip headers after defined count
    this.server.maxHeadersCount = this.options.maxHeadersCount;//default is 2000
    //TODO: to test
    this.options.setTimeout && this.server.setTimeout(this.options.timeout);

    const sLocal = this.server;
    //this.server.on('request', requestResponseHandler);
    this.server.on('error', function(err){
		eventEmitter.emit('onServerError');
		networkErrHandler(err,options.port, options.host, sLocal);
	});
}

function http2(){
    try {
        return require('http2')
      } catch (err) {
        throw Error('Current version of node doesn\'t supports http2.');
      }
}

module.exports = Server;