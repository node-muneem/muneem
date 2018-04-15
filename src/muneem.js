const Container = require("./HandlersContainer");
const RoutesManager = require("./routesManager");
const Server = require("./server");
const HttpAnswer = require("./HttpAnswer");
const SerializerFactory = require("./SerializerFactory");
const Compressors = require("./CompressorsContainer");

var events = require('events');
require("./globalErrorHandler");
Muneem.logger = require("./fakeLogger");

Muneem.setLogger = function(logger){
    Muneem.logger.log = logger;
}

Muneem.prototype.registerDefaultSerializers = function(){
    this.addObjectSerializer("*/*" , require("./defaultHandlers/defaultSerializer"));
    this.addObjectSerializer("application/json" , require("./defaultHandlers/defaultSerializer"));
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
    Muneem.logger.log.info("Adding __defaultRoute Handler")
    this.addHandler("__defaultRoute" , require("./defaultHandlers/defaultRoute"));

    Muneem.logger.log.info("Adding __exceedContentLength handler")
    this.addHandler("__exceedContentLength" , require("./defaultHandlers/exceedContentLengthHandler"));

    Muneem.logger.log.info("Adding __error handler")
    this.addHandler("__error" , require("./defaultHandlers/exceptionHandler"));
}

Muneem.prototype.start = function(serverOptions){
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
            || (this.threshold > 0 && this.threshold <= answer.data.length)
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
    this.eventEmitter = new events.EventEmitter();
    this.containers = {
        handlers : new Container(),
        serializers : new SerializerFactory(),
        compressors : new Compressors(),
        streamCompressors : new Compressors()
    }

    this.registerDefaultHandlers();
    this.registerDefaultSerializers();
    this.registerDefaultCompressors();

    this.routesManager = new RoutesManager(this.appContext,this.containers);
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

Muneem.prototype.addObjectSerializer = function(mimeType, serializer ){
    Muneem.logger.log.info("Adding a serializer to handle " + mimeType);
    this.containers.serializers.add(mimeType, serializer);
}

Muneem.prototype.addCompressor = function(technique, compressor ){
    Muneem.logger.log.info("Adding a compressor to handle " + technique);
    this.containers.compressors.add(technique, compressor);
}

Muneem.prototype.addStreamCompressor = function(technique, compressor ){
    Muneem.logger.log.info("Adding a compressor to handle " + technique);
    this.containers.streamCompressors.add(technique, compressor);
}

/**
 * Add handlers to the container which should be used by each router
 */
Muneem.prototype.addHandler = function(name,handler){
    this.containers.handlers.add(name,handler);
    return this;
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

module.exports = Muneem
