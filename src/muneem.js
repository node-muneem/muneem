const Container = require("./Container");
const RoutesManager = require("./routesManager");
const Server = require("./server");
const HttpAnswer = require("./HttpAnswer");
const SerializerFactory = require("./SerializerFactory");
var events = require('events');
require("./globalErrorHandler");
Muneem.logger = require("./fakeLogger");

Muneem.setLogger = function(logger){
    Muneem.logger.log = logger;
}

Muneem.prototype.registerDefaultSerializers = function(){
    this.addObjectSerializer("*/*" , require("./specialHandlers/defaultSerializer"));
    this.addObjectSerializer("application/json" , require("./specialHandlers/defaultSerializer"));
}

Muneem.prototype.registerDefaultHandlers = function(){
    Muneem.logger.log.info("Adding __defaultRoute Handler")
    this.addHandler("__defaultRoute" , require("./specialHandlers/defaultRoute"));

    Muneem.logger.log.info("Adding __exceedContentLength handler")
    this.addHandler("__exceedContentLength" , require("./specialHandlers/exceedContentLengthHandler"));

    Muneem.logger.log.info("Adding __error handler")
    this.addHandler("__error" , require("./specialHandlers/exceptionHandler"));
}

Muneem.prototype.start = function(serverOptions){
    if(this.appContext.mappings){
        this.routesManager.addRoutesFromMappingsFile(this.appContext.mappings);
    }
    this.server = new Server(serverOptions, this.routesManager.router, this.eventEmitter);
    this.server.start();
}

const defaultOptions = {
    alwaysReadRequestPayload: false
}
function Muneem(options){
    if(!(this instanceof Muneem)) return new Muneem(options);
    
    this.appContext =  Object.assign({},defaultOptions,options);
    this.eventEmitter = new events.EventEmitter();
    this.container = new Container();
    this.registerDefaultHandlers();
    this.serializerFactory = new SerializerFactory();
    this.registerDefaultSerializers();
    this.routesManager = new RoutesManager(this.appContext,this.container,this.serializerFactory);
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
    this.serializerFactory.add(mimeType, serializer);
}

/**
 * Add handlers to the container which should be used by each router
 */
Muneem.prototype.addHandler = function(name,handler){
    this.container.add(name,handler);
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
