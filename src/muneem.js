const Container = require("./HandlersContainer");
const RoutesManager = require("./routesManager");
const Server = require("./server");
const HttpAnswer = require("./HttpAnswer");
const Serializers = require("./SerializersContainer");
const Compressors = require("./CompressorsContainer");
const ApplicationSetupError = require("./ApplicationSetupError");
const fs = require("fs");
const path = require("path");

var events = require('events');
require("./globalErrorHandler");
Muneem.logger = require("./fakeLogger");

Muneem.setLogger = function(logger){
    if(logger 
        && typeof logger.info === "function" 
        && typeof logger.debug === "function" 
        && typeof logger.error === "function" 
        && typeof logger.warn === "function" 
    ){
        Muneem.logger.log = logger;
    }else{
        throw Error("Given logger doesn't support all standard logging methods.");
    }
}

Muneem.prototype.registerDefaultSerializers = function(){
    //this.addSerializer("*/*" , require("./defaultHandlers/defaultSerializer"));
    this.addSerializer("application/json" , require("./defaultHandlers/defaultSerializer"));
}

Muneem.prototype.registerDefaultCompressors = function(){
    this.addCompressor("*" , require("./defaultHandlers/compressors/gzip"));
    this.addStreamCompressor("*" , require("./defaultHandlers/compressors/gzipStream"));

    this.addCompressor("gzip" , require("./defaultHandlers/compressors/gzip"));
    this.addStreamCompressor("gzip" , require("./defaultHandlers/compressors/gzipStream"));

    this.addCompressor("deflat" , require("./defaultHandlers/compressors/deflat"));
    this.addStreamCompressor("deflat" , require("./defaultHandlers/compressors/deflatStream"));
}

Muneem.prototype.registerDefaultHandlers = function(){
    this.on("defaultRoute", require("./defaultHandlers/defaultRoute") );
    this.on("fatBody", require("./defaultHandlers/exceedContentLengthHandler") );
    this.on("error", require("./defaultHandlers/exceptionHandler") );
}

Muneem.prototype.start = function(serverOptions){
    if(serverOptions){
        this.appContext.http2 = serverOptions.http2;
        this.appContext.https = serverOptions.https !== undefined ? true : false;
    }

    if(this.appContext.mappings){
        this.routesManager.addRoutesFromMappingsFile(this.appContext.mappings);
    }
    this.server = new Server(serverOptions, this.routesManager.router, this.eventEmitter);
    this.server.start();
}
const defaultCompressionOptions = {
    //preference : ["gzip"],
    // minimum length of data to apply compression. Not applicable on stream
    threshold : 1024,
    filter : function(asked,answer){
        if(asked.headers['x-no-compression'] 
            || asked.headers['cache-control'] === 'no-transform'
        ){
            return false;
        }else{
            return true;
        }
    }
};

const defaultOptions = {
    alwaysReadRequestPayload: false,
    compress : true,
    maxLength: 1e6
}
function Muneem(options){
    if(!(this instanceof Muneem)) return new Muneem(options);
    
    this.appContext =  Object.assign({},defaultOptions,options);

    if(this.appContext.compress){
        this.appContext.compress =  Object.assign({},defaultCompressionOptions,this.appContext.compress);
        this.appContext.compress.shouldCompress = true;
    }else{
        this.appContext.compress = defaultCompressionOptions;
        this.appContext.compress.shouldCompress = false; 
    }
    if(typeof this.appContext.compress.preference === "string"){
        this.appContext.compress.preference = [ this.appContext.compress.preference ];
    }

    

    this.eventEmitter = new events.EventEmitter();
    this.containers = {
        handlers : new Container(),
        serializers : new Serializers(),
        compressors : new Compressors(),
        streamCompressors : new Compressors()
    }

    if(this.appContext.handlers){
        if(Array.isArray(this.appContext.handlers)){
            this.appContext.handlers.forEach(dir => {
                this._addHandlers(dir);    
            })
        }else{
            this._addHandlers(this.appContext.handlers);
        }
    }

    this.registerDefaultHandlers();
    this.registerDefaultSerializers();
    this.registerDefaultCompressors();

    this.routesManager = new RoutesManager(this.appContext,this.containers,this.eventEmitter);
}

/**
 * Add custom method to HttpAnswer
 * @param {string} methodName 
 * @param {function} fn 
 */
Muneem.addToAnswer = function(methodName, fn ){
    Muneem.logger.log.info("Adding a methods " + methodName + " to HttpAnswer");
    HttpAnswer.prototype[methodName] = fn;
}

Muneem.prototype.addSerializer = function(mimeType, serializer ){
    Muneem.logger.log.info("Adding a serializer to handle " + mimeType);
    this.containers.serializers.add(mimeType, serializer);
}

Muneem.prototype.addCompressor = function(technique, compressor ){
    Muneem.logger.log.info("Adding a compressor to handle " + technique);
    this.containers.compressors.add(technique, compressor);
}

Muneem.prototype.addStreamCompressor = function(technique, compressor ){
    Muneem.logger.log.info("Adding a stream compressor to handle " + technique);
    this.containers.streamCompressors.add(technique, compressor);
}

/**
 * Add handlers to the container which should be used by each router
 */
Muneem.prototype.addHandler = function(name,handler){
    this.containers.handlers.add(name,handler);
    return this;
}

/*
Add handlers, serializers, and compressors from a directory.

Handler should have name,
serializers must have type,serialize/handle, 
compressors must have type, compress/handler
*/
Muneem.prototype._addHandlers = function(dir) {
    var aret = [];
    fs.readdirSync(dir).forEach( library => {

        const fullPath = path.join(dir, library);
        if(fs.lstatSync(fullPath).isDirectory()){
            this._addHandlers(fullPath);
            return;
        }
        var isLibrary = library.split(".").length > 0 && library.split(".")[1] === 'js',
        libName = library.split(".")[0].toLowerCase();
        if (isLibrary) {
            aret[libName] = require(fullPath);
            //TODO: call an event; onHandlerLoad or something

            if(typeof aret[libName] === 'object'){
                if(aret[libName].handle){
                    if(!aret[libName].name){
                        throw new ApplicationSetupError("A handler should have property 'name'.");
                    }
                    this.addHandler(aret[libName].name, aret[libName].handle);

                }else if(aret[libName].compress){
                    if(!aret[libName].type){
                        throw new ApplicationSetupError("A compressor should have property 'type'.");
                    }
                    this.addCompressor(aret[libName].type, aret[libName].compress);

                }else if(aret[libName].serialize){
                    if(!aret[libName].type){
                        throw new ApplicationSetupError("A serializer should have property 'type'.");
                    }
                    this.addSerializer(aret[libName].type, aret[libName].serialize);
                }
            }else{
                throw new ApplicationSetupError(`Invalid handler ${libName}`);
            }
            
        }
    });
    return  aret;
}

Muneem.prototype.route = function(route){
    this.routesManager.addRoute(route);
    return this;
}

/* Before */

Muneem.prototype.beforeEachPreHandler = function(fn){
    this.routesManager.beforeEachPreHandler.push(fn);
}

Muneem.prototype.beforeMainHandler = function(fn){
    this.routesManager.beforeMainHandler.push(fn);
}

Muneem.prototype.beforeEachPostHandler = function(fn){
    this.routesManager.beforeEachPostHandler.push(fn);
}

Muneem.prototype.beforeEachHandler = function(fn){
    this.routesManager.beforeEachPreHandler.push(fn);
    this.routesManager.beforeEachPostHandler.push(fn);
    this.routesManager.beforeMainHandler.push(fn);
}

/* After */

Muneem.prototype.afterEachPreHandler = function(fn){
    this.routesManager.afterEachPreHandler.push(fn);
}

Muneem.prototype.afterMainHandler = function(fn){
    this.routesManager.afterMainHandler.push(fn);
}

Muneem.prototype.afterEachPostHandler = function(fn){
    this.routesManager.afterEachPostHandler.push(fn);
}

Muneem.prototype.afterEachHandler = function(fn){
    this.routesManager.afterEachPreHandler.push(fn);
    this.routesManager.afterEachPostHandler.push(fn);
    this.routesManager.afterMainHandler.push(fn);
}

//commented until the performance of the application is analyzed
/* Muneem.prototype.beforeHandler = function(name,fn){
    this.routesManager.beforeHandler.add(name,fn);
}

Muneem.prototype.afterHandler = function(name,fn){
    this.routesManager.afterHandler.add(name,fn);
} */
/**
 * Supported Events
 * 
 * addRoute : just after the route is added; args: route context
 * serverStart, start, afterServerStart, afterStart : just after server starts; 
 * request, question, asked : before route; raw request, raw response
 * route : beforeAll handlers; asked, answer
 * exceedContentLengthn, fatBody; asked, answer
 * handle : before any handler executes; asked, answer
 * afterHandle: after any handler executes; asked, answer
 * serialize : before Serialization happens; asked, answer
 * compress : before Compression happens; asked, answer
 * send, answer, response, afterSend, afterAnswer, afterResponse : After sending the response; asked, answer, isStream
 * 
 * serverClose, close : just before server's close is triggered
 * error
 * defaultRoute, missingMapping, routeNotFound
 * @param {string} eventName 
 * @param {function} callback 
 */
Muneem.prototype.on = function(eventName, callback){
    Muneem.logger.log.info(`Adding event ${eventName}`);
    if( eventName === "addRoute"){
        Muneem.logger.log.warn(`Handler registered for '${eventName}' event can know the name and sequence of handlers for any route.`);
    }else if( eventName === "serverStart" || eventName === "start" || eventName === "afterServerStart" || eventName === "afterStart"){
        Muneem.logger.log.warn(`Handler registered for '${eventName}' event can read server's host, and port.`);
        eventName = "afterServerStart"
    }else if( eventName === "request"){
        Muneem.logger.log.warn("Handler registered for 'request' event can read raw request which may contain sensitive information.");
    }else if( eventName === "route"){
        Muneem.logger.log.warn("Handler registered for 'route' event can read request before any other handler which may contain sensitive information.");
    }else if( eventName === "exceedContentLength" || eventName === "fatBody"){
        eventName = "fatBody"
        this.eventEmitter.removeAllListeners(eventName);
    }else if( eventName === "serialize" || eventName === "afterSerialize"){
        eventName = "afterSerialize";
    }else if( eventName === "compress" || eventName === "afterCompress"){
        eventName = "afterCompress";
    }else if( eventName === "send" || eventName === "answer" || eventName === "response" || eventName === "afterAnswer" || eventName === "afterResponse"){
        eventName = "afterAnswer";
    }else if( eventName === "close" || eventName === "serverClose"){
        eventName = "afterServerClose";
    }else if( eventName === "routeNotFound" || eventName === "missingMapping"){
        eventName = "defaultRoute";
    }else if(eventName.toLowerCase() === "error"){
        this.eventEmitter.removeAllListeners("error");    
    }
    this.eventEmitter.on(eventName,callback);
}

/**
 * Supported Events
 * 
 * addRoute : just before the route is added; args: route context
 * serverStart, start : just before server starts; 
 * handle : before any handler executes
 * afterHandle: after any handler executes
 * serialize : before Serialization happens
 * compress : before Compression happens
 * send, answer, response : Before sending the response
 * serverClose, close : just before server's close is triggered
 * 
 * @param {string} eventName 
 * @param {function} callback 
 */
Muneem.prototype.before = function(eventName, callback){
    Muneem.logger.log.info(`Adding event before ${eventName}`);
    if( eventName === "route"){//request event is triggered before route
        eventName = "request";
    }else if( eventName === "serverStart" || eventName === "start"){
        eventName = "beforeServerStart";
    }else if( eventName === "serialize"){
        eventName = "beforeSerialize";
    }else if( eventName === "compress"){
        eventName = "beforeCompress";
    }else if( eventName === "send" || eventName === "answer" || eventName === "response"){
        eventName = "beforeAnswer";
    }else if( eventName === "close" || eventName === "serverClose"){
        eventName = "beforeServerClose";
    }

    this.eventEmitter.on(eventName,callback);
}

module.exports = Muneem
