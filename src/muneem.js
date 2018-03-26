const Container = require("./Container");
const RoutesManager = require("./routesManager");
const Server = require("./server");
const HttpAnswer = require("./HttpAnswer");
var events = require('events');
const Handler = require("./Handler");
require("./globalErrorHandler");
Muneem.logger = require("./fakeLogger");

Muneem.setLogger = function(logger){
    Muneem.logger.log = logger;
}

Muneem.prototype.registerDefaultHandlers = function(){
    Muneem.logger.log.info("Adding __defaultRoute Handler")
    this.addHandler("__defaultRoute" , require("./specialHandlers/defaultRoute").handle);

    Muneem.logger.log.info("Adding __exceedContentLength handler")
    this.addHandler("__exceedContentLength" , require("./specialHandlers/exceedContentLengthHandler").handle);

    Muneem.logger.log.info("Adding __error handler")
    this.addHandler("__error" , require("./specialHandlers/exceptionHandler").handle,{ inParallel : true});
}

Muneem.prototype.createServer = function(serverOptions){
    this.routesManager.addRoutesFromMappingsFile(this.appContext.mappings);
    return new Server(serverOptions, this.routesManager.router, this.eventEmitter);
}

function Muneem(options){
    if(!(this instanceof Muneem)) return new Muneem(options);
    
    this.appContext =  options;
    this.eventEmitter = new events.EventEmitter();
    this.container = new Container();
    this.registerDefaultHandlers();
    this.routesManager = new RoutesManager(this.appContext,this.container);
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

/**
 * Add handlers to the container which should be used by each router
 */
Muneem.prototype.addHandler = function(name,handler,options){
    //console.log("adding", name)
    const h = new Handler(name,handler,options);
    return this.container.add(name,h);
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
