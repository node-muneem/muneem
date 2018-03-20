const HandlersMap = require("./HandlersMap");
const mapRoutes = require("./routesMapper").mapRoutes;
const Server = require("./server");
const HttpAnswer = require("./HttpAnswer");
var events = require('events');


const registerDefaultHandlers = function(handlers){
    handlers.add("__defaultRoute" , require("./specialHandlers/defaultRoute")).toHandle("response");
    handlers.add("__exceedContentLength" , require("./specialHandlers/exceedContentLengthHandler")).toHandle("response");
}

Muneem.prototype.createServer = function(serverOptions){
    mapRoutes(this.router,this.appContext,this.handlers);
    return new Server(serverOptions, this.router, this.eventEmitter);
}

function Muneem(options){
    if(!(this instanceof Muneem)) return new Muneem(options);
    this.appContext =  options;
    this.eventEmitter = new events.EventEmitter();
    this.handlers = new HandlersMap();
    registerDefaultHandlers(this.handlers);
    handlers = this.handlers;
    this.router = require('find-my-way')( {
        ignoreTrailingSlash: true,
        maxParamLength: options.maxParamLength || 100,
        defaultRoute : () =>{
            handlers.get("__defaultRoute")();
        }
    } );
}

Muneem.addToAnswer = function(methodName, fn ){
    HttpAnswer.prototype[methodName] = fn;
}

module.exports = Muneem

//options
//  content location
//  route mapping location
//  profile
