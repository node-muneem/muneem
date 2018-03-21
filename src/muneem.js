const HandlersMap = require("./HandlersMap");
const RoutesManager = require("./routesManager");
const Server = require("./server");
const HttpAnswer = require("./HttpAnswer");
const log = require("./fakeLogger");
var events = require('events');


const registerDefaultHandlers = function(handlers){
    log.info("Adding __defaultRoute Handler")
    handlers.add("__defaultRoute" , require("./specialHandlers/defaultRoute").handle).toHandle("response");
    log.info("Adding __exceedContentLength handler")
    handlers.add("__exceedContentLength" , require("./specialHandlers/exceedContentLengthHandler").handle).toHandle("response");
    log.info("Adding __error handler")
    handlers.add("__error" , require("./specialHandlers/exceptionHandler").handle,{ inParallel : true});
}

Muneem.prototype.createServer = function(serverOptions){
    this.routesManager.addRoutesFromMappingsFile(this.appContext.mappings);
    if(this.routesManager.router.routes.length === 0){
        throw Error("There is no route exist. Please check the mapping file or add them from the code.");
    }
    return new Server(serverOptions, this.routesManager.router, this.eventEmitter);
}

function Muneem(options){
    if(!(this instanceof Muneem)) return new Muneem(options);
    this.appContext =  options;
    this.eventEmitter = new events.EventEmitter();
    this.handlers = new HandlersMap();
    registerDefaultHandlers(this.handlers);
    this.routesManager = new RoutesManager(this.appContext,this.handlers);
}

Muneem.addToAnswer = function(methodName, fn ){
    log.info("Adding a methods " + methodName + " to HttpAnswer");
    HttpAnswer.prototype[methodName] = fn;
}

Muneem.log = log;
module.exports = Muneem

//options
//  content location
//  route mapping location
//  profile
