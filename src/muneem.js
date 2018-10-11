const Container = require("./HandlersContainer");
const RoutesManager = require("./routesManager");
const Server = require("./server");
const HttpAnswer = require("./HttpAnswer");
const HttpAsked = require("./HttpAsked");
const ApplicationSetupError = require("./ApplicationSetupError");
const fs = require("fs");
const path = require("path");
var merge = require('merge-descriptors');
var appEvents = require('./appEvents');
var http = require('http')
var httpMethods = http.METHODS;

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
    this.setRouteNotFoundHandler( require("./defaultHandlers/defaultRoute") );
    this.setFatBodyHandler( require("./defaultHandlers/exceedContentLengthHandler") );
    this.setErrorHandler( require("./defaultHandlers/exceptionHandler") );
}

/**
 * Add custom error handler
 * @param {function} fn 
 */
Muneem.prototype.setErrorHandler = function( fn ){
    this.checkIfNotStarted();
    Muneem.logger.log.info("Adding custom error handler.");
    this.eventEmitter.removeAllListeners("error-handler");
    this.eventEmitter.on("error-handler", fn);
}

/**
 * Add custom resource/route not found handler
 * @param {function} fn 
 */
Muneem.prototype.setRouteNotFoundHandler = function( fn ){
    this.checkIfNotStarted();
    Muneem.logger.log.info("Adding custom route not found handler.");
    this.eventEmitter.removeAllListeners("route-not-found-handler");
    this.eventEmitter.on("route-not-found-handler", fn);
}

/**
 * Add custom exceed content length or fat body handler
 * @param {function} fn 
 */
Muneem.prototype.setFatBodyHandler = function( fn ){
    this.checkIfNotStarted();
    Muneem.logger.log.info("Adding custom fat body handler.");
    this.eventEmitter.removeAllListeners("fat-body-handler");
    this.eventEmitter.on("fat-body-handler", fn);
}

const defaultOptions = {
    alwaysReadRequestPayload: false,
    maxLength: 1e6
}
function Muneem(options){
    if(!(this instanceof Muneem)) return new Muneem(options);

    merge(this, appEvents, false);

    this.state = "created";
    options = options || {};
    const appContext =  Object.assign({},defaultOptions);
    const _store = {};

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
    _store["app context"] = appContext;
    this.routesManager = new RoutesManager( this.containers, this.eventEmitter, _store);
    this.before("serverClose", () => {
        this.state = "closed";
    });

    //add methods to register a route directly with httpMethods
    for (var index in httpMethods) {
        const methodName = httpMethods[index];
        const methodNameInSmall = methodName.toLowerCase();
      
        this[methodNameInSmall] = function (url, fn) {
          return this.routesManager.addRoute({
              when : methodName,
              url : url,
              to : fn
          });
        }
    }

    this.start = function(){//a plugin should not know server configuration
        /* if(this.state === "started"){
            Muneem.logger.log.info("Server has already been started");
            return;
        } */
        var serverOptions = {
            requestId : options.requestId
        };
        if(arguments.length > 0){
            if( typeof arguments[0] === 'object') {
                serverOptions = arguments[0];
                if( arguments[2]){ //callback
                    this.on( "start", arguments[3] );
                }

                appContext.http2 = serverOptions.http2;
                appContext.https = serverOptions.https !== undefined ? true : false;
            }else{
                serverOptions.port = arguments[0];
                if( arguments[1] && typeof arguments[1] !== "function"){
                    serverOptions.host = arguments[1];
                }
                if( arguments[2] && typeof arguments[2] !== "function"){
                    serverOptions.backlog = arguments[2];
                }
                if( arguments[3] ){//callback
                    this.on( "start", arguments[3] );
                }
            }
        }
    
        //routes must be added when all type of handlers and events are added
        if(options.mappings){
            this.routesManager.addRoutesFromMappingsFile(options.mappings);
        }
        const server = new Server(serverOptions, this.routesManager.router, this.eventEmitter);
        server.start();
        this.state = "started";

        logEventDetails( this.eventEmitter );
        
    }
    
    

    this.addToStore = function(_name, resource, safe){
        this.checkIfNotStarted();
        if( _store[ _name] && safe) throw ApplicationSetupError(`You're trying to overwrite a resource ${_name}`);
        Muneem.logger.log.info("Adding a resource " + _name);
        _store[_name] = resource;
    }
}

function logEventDetails(emitter){
    const eventNames = emitter.eventNames();
    Muneem.logger.log.info("Registered events");
    Muneem.logger.log.info("----------------------------------------");
    for( var i in  eventNames){
        Muneem.logger.log.info( eventNames[i] ," \t: ", emitter.listenerCount( eventNames[i] ) )
    }
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
 * add("route", object)
 * add("handler", name, object | function)
 * add("resource", name, object | function)
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
        this.containers.handlers.add(handler, _name);
    }else if(type === "route"){
        this.routesManager.addRoute(handler);
    }else if(type === "resource"){
        this.addToStore(handler, _name);
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
Muneem.prototype._addHandlers = function(dir, rootDir) {
    if(!rootDir) rootDir = dir;
    fs.readdirSync(dir).forEach( file => {
        //console.log(file);
        const fullPath = path.join(dir, file);
        if(fs.lstatSync(fullPath).isDirectory()){
            this._addHandlers(fullPath, rootDir);
            return;
        }

        var fileNameParts = file.split(".");
        var isJs = fileNameParts.length > 0 && fileNameParts[1] === 'js'; //ends with .js extension
        //console.log(fullPath, rootDir)
        if (isJs && isHandler(fullPath)) {
            var handlerName = fullPath.substr(rootDir.length + 1).toLowerCase().replace(/\//, ".");
            handlerName = handlerName.substr(0, handlerName.length - 3);
            console.log("registering", handlerName);
            var handler = require(fullPath);
            //TODO: call an event; onHandlerLoad or something

            if(typeof handler === 'function'){
                this.addHandler( handlerName, handler);
            }else{
                throw new ApplicationSetupError(`Invalid handler ${fullPath}`);
            }
            
        }
    });
}

function isHandler(fullPath){
    //read the file content
    const fileContent = fs.readFileSync(fullPath).toString();
    var result = new RegExp(/\s*\/\/\s*@handler\s*$/, "gm").exec( fileContent);
    if( result ){
        return true;
    }else{
        return false;
    }
}

Muneem.prototype.route = function(route){
    this.checkIfNotStarted();
    if( Array.isArray(route) ){
        for(let index=0;index<route.length;index++){
            this.routesManager.addRoute(route[index]);
        }
    }else{
        this.routesManager.addRoute(route);
    }
    return this;
}

//commented until the performance of the application is analyzed
/* Muneem.prototype.beforeHandler = function(name,fn){
    this.routesManager.beforeHandler.add(name,fn);
}

Muneem.prototype.afterHandler = function(name,fn){
    this.routesManager.afterHandler.add(name,fn);
} */


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
