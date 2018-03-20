const HandlersMap = require("./HandlersMap");
const RoutesManager = require("./routesManager");
const Server = require("./server");
const HttpAnswer = require("./HttpAnswer");
var events = require('events');


const registerDefaultHandlers = function(handlers){
    handlers.add("__defaultRoute" , require("./specialHandlers/defaultRoute")).toHandle("response");
    handlers.add("__exceedContentLength" , require("./specialHandlers/exceedContentLengthHandler")).toHandle("response");
}

Muneem.prototype.createServer = function(serverOptions){
    this.routesManager.addRoutesFromMappingsFile(this.appContext.mappings);
    if(this.routesManager.router.routes.length === 0){
        throw Error("There is no route exist. Please check the mapping file or add them from the code.");
    }
    return new Server(serverOptions, this.router, this.eventEmitter);
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
    HttpAnswer.prototype[methodName] = fn;
}

module.exports = Muneem

//options
//  content location
//  route mapping location
//  profile
