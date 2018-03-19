const HandlersMap = require("./HandlersMap");
const mapRoutes = require("./routesMapper").mapRoutes;
const Server = require("./server");
var events = require('events');


Muneem.prototype.createServer = function(options){
    mapRoutes(this.router,this.options.mappings,this.handlers);
    return new Server(options, this.router, this.eventEmitter);
}

function Muneem(options){
    this.options = options;
    this.eventEmitter = new events.EventEmitter();
    this.handlers = new HandlersMap();
    this.router = require('find-my-way')(/* {
        ignoreTrailingSlash: true,
        //maxParamLength: 500, //default is 100
    } */);
}


module.exports = function(options){
    return new Muneem(options);
};

//options
//  content location
//  route mapping location
//  profile
