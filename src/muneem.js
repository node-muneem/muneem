const Container = require("./HandlersContainer");
const RoutesManager = require("./routesManager");
const Server = require("./server");
const HttpAnswer = require("./HttpAnswer");
const HttpAsked = require("./HttpAsked");
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

Muneem.prototype.registerDefaultHandlers = function(){
    this.checkIfNotStarted();    
    this.on("defaultRoute", require("./defaultHandlers/defaultRoute") );
    this.on("fatBody", require("./defaultHandlers/exceedContentLengthHandler") );
    this.on("error", require("./defaultHandlers/exceptionHandler") );
}

Muneem.prototype.start = function(serverConfig){//a plugin should not know server configuration
    /* if(this.state === "started"){
        Muneem.logger.log.info("Server has already been started");
        return;
    } */
    
    if(serverConfig){
        this.appContext.http2 = serverConfig.http2;
        this.appContext.https = serverConfig.https !== undefined ? true : false;
    }

    //routes must be added when all type of handlers and events are added
    //hence adding at the time of starting the server.
    if(this.options.mappings){
        this.routesManager.addRoutesFromMappingsFile(this.options.mappings);
    }
    const server = new Server(serverConfig, this.routesManager.router, this.eventEmitter);
    server.start();
    this.state = "started";
}

const defaultOptions = {
    alwaysReadRequestPayload: false,
    maxLength: 1e6
}
function Muneem(options){

    if(!(this instanceof Muneem)) return new Muneem(options);
    this.state = "created";
    this.options = options || {};
    this.appContext =  Object.assign({},defaultOptions);
    this._store = {};

    this.eventEmitter = new events.EventEmitter();
    this.containers = {
        handlers : new Container()
    }

    if(options && options.handlers){//load handlers from given path(s)
        if(Array.isArray(options.handlers)){
            options.handlers.forEach(dir => {
                this._addHandlers(dir);    
            })
        }else{
            this._addHandlers(options.handlers);
        }
    }

    this.registerDefaultHandlers();

    this.routesManager = new RoutesManager( this.appContext, this.containers, this.eventEmitter, this._store);
    this.before("serverClose", () => {
        this.state = "closed";
    });
}

/**
 * Add custom method to HttpAnswer
 * @param {string} methodName 
 * @param {function} fn 
 */
Muneem.prototype.addToAnswer = function(methodName, fn ){
    this.checkIfNotStarted();
    Muneem.logger.log.info("Adding a method " + methodName + " to HttpAnswer");
    HttpAnswer.prototype[methodName] = fn;
}

/**
 * Add custom method to HttpAsked
 * @param {string} methodName 
 * @param {function} fn 
 */
Muneem.prototype.addToAsked = function(methodName, fn ){
    this.checkIfNotStarted();
    Muneem.logger.log.info("Adding a method " + methodName + " to HttpAsked");
    HttpAsked.prototype[methodName] = fn;
}

/**
 * Add something to the store that can be requested from a request handler
 * @param {string} _name 
 * @param {any} anything 
 */
Muneem.prototype.addToStore = function(_name, anything, safe){
    this.checkIfNotStarted();
    if( this._store[ _name] && safe) throw ApplicationSetupError(`You're trying to overwrite a resource ${_name}`);
    Muneem.logger.log.info("Adding a resource " + _name);
    this._store[_name] = anything;
}

/**
 * add("route", object)
 * add("handler", object | function, name)
 * add("resource", object | function, name)
 * 
 * @param {string} type 
 * @param {any} handler 
 * @param {string} _name 
 */
Muneem.prototype.add = function(type, handler, _name  ){
    this.checkIfNotStarted();
    if(!type || !handler){
        throw Error("Please provide valid parameters");
    }
    type = type.toLowerCase();
    
    if(type === "handler"){
        this.containers.handlers.add(_name ,handler);
    }else if(type === "route"){
        this.routesManager.addRoute(handler);
    }else if(type === "resource"){
        this.addToStore(_name, handler);
    }else {
        throw Error("Please provide valid handler type");
    }
    return this;
};

/**
 * Add handlers to the container which should be used by each router
 */
Muneem.prototype.addHandler = function(name,handler){
    this.containers.handlers.add(name,handler);
    return this;
}

/*
Add handlers from a directory.
Handler should have name,
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

                }
            }else{
                throw new ApplicationSetupError(`Invalid handler ${libName}`);
            }
            
        }
    });
    return  aret;
}

Muneem.prototype.route = function(route){
    this.checkIfNotStarted();
    this.routesManager.addRoute(route);
    return this;
}

//commented until the performance of the application is analyzed
/* Muneem.prototype.beforeHandler = function(name,fn){
    this.routesManager.beforeHandler.add(name,fn);
}

Muneem.prototype.afterHandler = function(name,fn){
    this.routesManager.afterHandler.add(name,fn);
} */

Muneem.prototype.on = function(eventName, callback){
    this.checkIfNotStarted();
    return this.after(eventName, callback);
};
/**
 * Supported Events
 * 
 * addRoute : just after the route is added; args: route context
 * serverStart, start : just after server starts; 
 * request : before route; raw request, raw response
 * route : before all handlers; asked, answer
 * exceedContentLengthn, fatBody; asked, answer
 * send, answer, response : After sending the response; asked, answer, isStream
 * serverclose, close : just before server's close is triggered
 * routeNotFound : when no matching route is found
 * error : on error
 * @param {string} eventName 
 * @param {function} callback 
 */

Muneem.prototype.after = function(eventName, callback){
    this.checkIfNotStarted();
    var eventNameInLower = eventName;
    if(!eventName || !callback) {
        throw Error("Please provide the valid parameters");
    }else{
        Muneem.logger.log.info(`Adding after event ${eventName}`);
        eventNameInLower = eventNameInLower.replace(/-/g,"");
        eventNameInLower = eventNameInLower.toLowerCase();
    }

    if( eventNameInLower === "addroute"){
        Muneem.logger.log.warn(`Security warning: Handler registered for '${eventName}' event can know the name and sequence of handlers for any route.`);
    }else if( eventNameInLower === "serverstart" || eventNameInLower === "start" ){
        Muneem.logger.log.warn(`Security warning: Handler registered for '${eventName}' event can read server's host, and port.`);
        eventName = "afterServerStart"
    }else if( eventNameInLower === "request"){
        Muneem.logger.log.warn("Security warning: Handler registered for 'request' event can read raw request which may contain sensitive information.");
    }else if( eventNameInLower === "route"){
        Muneem.logger.log.warn("Security warning: Handler registered for 'route' event can read request before any other handler which may contain sensitive information.");
    }else if( eventNameInLower === "exceedcontentlength" || eventNameInLower === "fatbody"){
        eventName = "fatBody"
        //this.eventEmitter.removeAllListeners(eventName);
    }else if( eventNameInLower === "send" || eventNameInLower === "answer" || eventNameInLower === "response" ){
        eventName = "afterAnswer";
    }else if( eventNameInLower === "close" || eventNameInLower === "serverclose"){
        eventName = "afterServerClose";
    }else if( eventNameInLower === "routenotfound" || eventNameInLower === "missingmapping" || eventNameInLower === "defaultroute"){
        eventName = "defaultRoute";
    }else if(eventNameInLower === "error"){
        //this.eventEmitter.removeAllListeners("error");    
    }else{
        this._addAfterHandlers(eventNameInLower,callback);
        return this;
    }
    this.eventEmitter.on(eventName,callback);
    return this;
}

/**
 * Supported Events
 * 
 * addRoute : just before the route is added; args: route context
 * serverStart, start : just before server starts; 
 * send, answer, response : Before sending the response
 * serverClose, close : just before server's close is triggered
 * 
 * @param {string} eventName 
 * @param {function} callback 
 */
Muneem.prototype.before = function(eventName, callback){
    this.checkIfNotStarted();
    var eventNameInLower = eventName;
    if(!eventName || !callback) {
        throw Error("Please provide the valid parameters");
    }else{
        Muneem.logger.log.info(`Adding event before ${eventName}`);
        eventNameInLower = eventNameInLower.replace(/-/g,"");
        eventNameInLower = eventNameInLower.toLowerCase();
    }

    if( eventNameInLower === "route"){//request event is triggered before route
        eventName = "request";
    }else if( eventNameInLower === "serverstart" || eventNameInLower === "start"){
        eventName = "beforeserverstart";
    }else if( eventNameInLower === "send" || eventNameInLower === "answer" || eventNameInLower === "response"){
        eventName = "beforeAnswer";
    }else if( eventNameInLower === "close" || eventNameInLower === "serverclose"){
        eventName = "beforeServerClose";
    }else{
        this._addBeforeHandlers(eventNameInLower,callback);
        return this;
    }

    this.eventEmitter.on(eventName,callback);
    return this;
}

Muneem.prototype._addBeforeHandlers = function(handlerType, fn){
    if( handlerType === "pre" || handlerType === "prehandler"  ){
        this.routesManager.beforeEachPreHandler.push(fn);
    }else if( handlerType === "post"  || handlerType === "posthandler" ){
        this.routesManager.beforeEachPostHandler.push(fn);
    }else if( handlerType === "each"  || handlerType === "eachhandler"){
        this.routesManager.beforeEachPreHandler.push(fn);
        this.routesManager.beforeEachPostHandler.push(fn);
        this.routesManager.beforeMainHandler.push(fn);
    }else if( handlerType === "main" || handlerType === "mainhandler"){
        this.routesManager.beforeMainHandler.push(fn);
    }else{
        throw Error("You've provided an invalid event name");
    }
}

Muneem.prototype._addAfterHandlers = function(handlerType, fn){
    if( handlerType === "pre" || handlerType === "prehandler"  ){
        this.routesManager.afterEachPreHandler.push(fn);
    }else if( handlerType === "post"  || handlerType === "posthandler" ){
        this.routesManager.afterEachPostHandler.push(fn);
    }else if( handlerType === "each"  || handlerType === "eachhandler"){
        this.routesManager.afterEachPreHandler.push(fn);
        this.routesManager.afterEachPostHandler.push(fn);
        this.routesManager.afterMainHandler.push(fn);
    }else if( handlerType === "main" || handlerType === "mainhandler"){
        this.routesManager.afterMainHandler.push(fn);
    }else{
        throw Error("You've provided an invalid event name");
    }
}

Muneem.prototype.checkIfNotStarted = function(){
    if(this.state === "started")
        throw new ApplicationSetupError("You need to complete the setup before starting the server.");
}

/**
 * To support style of other web frameworks
 * @param {string} methodName 
 * @param {function} fn 
 */
Muneem.prototype.use = function(fn, anything){
    if(typeof fn !== 'function') throw Error("The plugin you wanna use is not a function. I don't know how should I execute it.");
    fn(this, anything);
}

module.exports = Muneem
