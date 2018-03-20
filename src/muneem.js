const HandlersMap = require("./HandlersMap");
const mapRoutes = require("./routesMapper").mapRoutes;
const Server = require("./server");
const HttpAnswer = require("./HttpAnswer");
var events = require('events');


Muneem.prototype.createServer = function(serverOptions){
    mapRoutes(this.router,this.appContext,this.handlers);
    return new Server(serverOptions, this.router, this.eventEmitter);
}

function Muneem(options){
    if(!(this instanceof Muneem)) return new Muneem(options);
    this.appContext =  options;
    this.eventEmitter = new events.EventEmitter();
    this.handlers = new HandlersMap();
    this.router = require('find-my-way')(/* {
        ignoreTrailingSlash: true,
        //maxParamLength: 500, //default is 100
    } */);
}

Muneem.addToAnswer = function(methodName, fn ){
    HttpAnswer.prototype[methodName] = fn;
}

module.exports = Muneem

//options
//  content location
//  route mapping location
//  profile
