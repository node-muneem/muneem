
const logger = require("./fakeLogger");

/**
 * Application prototype.
 */

var app = exports = module.exports = {};



app.on = function(eventName, callback){
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

app.after = function(eventName, callback){
    this.checkIfNotStarted();
    var eventNameInLower = "";
    if(!eventName || !callback) {
        throw Error("Please provide the valid parameters");
    }else{
        logger.log.info(`Adding after event '${eventName}'`);
        eventNameInLower = eventName.replace(/-/g,"");
        eventNameInLower = eventNameInLower.toLowerCase();
    }

    if( eventNameInLower === "serverstart" || eventNameInLower === "start" ){
        eventName = "afterServerStart"
    }else if( eventNameInLower === "request"){
        logger.log.warn("Handler registered for 'request' event can access raw request.");
    }else if( eventNameInLower === "route"){
        logger.log.warn("Handler registered for 'route' event can access route configuration.");
    }else if( eventNameInLower === "exceedcontentlength" || eventNameInLower === "fatbody"){
        eventName = "fat-body-notify"
    }else if( eventNameInLower === "send" || eventNameInLower === "answer" || eventNameInLower === "response" ){
        eventName = "afterAnswer";
    }else if( eventNameInLower === "close" || eventNameInLower === "serverclose"){
        eventName = "afterServerClose";
    }else if( eventNameInLower === "routenotfound" || eventNameInLower === "missingmapping" || eventNameInLower === "defaultroute"){
        eventName = "route-not-found-notify";
    }else if(eventNameInLower === "error"){
        eventName = "error-notify";
    }else{
        this._addAfterHandlers(eventName,callback);
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
app.before = function(eventName, callback){
    this.checkIfNotStarted();
    var eventNameInLower = eventName;
    if(!eventName || !callback) {
        throw Error("Please provide the valid parameters");
    }else{
        logger.log.info(`Adding event before '${eventName}'`);
        eventNameInLower = eventNameInLower.replace(/-/g,"");
        eventNameInLower = eventNameInLower.toLowerCase();
    }

    if( eventNameInLower === "addroute"){
        logger.log.warn(`Security warning: Handler registered for '${eventName}' event can know the name and sequence of handlers and the configuration for any route.`);
    }else if( eventNameInLower === "route"){//request event is triggered before route
        logger.log.warn("Handler registered for before 'route' event can access raw request.");
        eventName = "request";
    }else if( eventNameInLower === "serverstart" || eventNameInLower === "start"){
        logger.log.warn(`Handler registered for '${eventName}' event can read server related information. Like: host, port etc.`);
        eventName = "beforeserverstart";
    }else if( eventNameInLower === "send" || eventNameInLower === "answer" || eventNameInLower === "response"){
        eventName = "beforeAnswer";
    }else if( eventNameInLower === "close" || eventNameInLower === "serverclose"){
        eventName = "beforeServerClose";
    }else{
        this._addBeforeHandlers(eventName,callback);
        return this;
    }

    this.eventEmitter.on(eventName,callback);
    return this;
}

app._addBeforeHandlers = function(handlerType, fn){

    var eventNameInLower = handlerType.replace(/-/g,"");
    eventNameInLower = eventNameInLower.toLowerCase();

    if( eventNameInLower === "pre" || eventNameInLower === "prehandler"  ){
        this.routesManager.beforeEachPreHandler.push(fn);
    }else if( eventNameInLower === "post"  || eventNameInLower === "posthandler" ){
        this.routesManager.beforeEachPostHandler.push(fn);
    }else if( eventNameInLower === "each"  || eventNameInLower === "eachhandler"){
        this.routesManager.beforeEachPreHandler.push(fn);
        this.routesManager.beforeEachPostHandler.push(fn);
        this.routesManager.beforeMainHandler.push(fn);
    }else if( eventNameInLower === "main" || eventNameInLower === "mainhandler"){
        this.routesManager.beforeMainHandler.push(fn);
    }else{
        throw Error(`You've provided an invalid event name: ${handlerType}`);
    }
}

app._addAfterHandlers = function(handlerType, fn){

    var eventNameInLower = handlerType.replace(/-/g,"");
    eventNameInLower = eventNameInLower.toLowerCase();

    if( eventNameInLower === "pre" || eventNameInLower === "prehandler"  ){
        this.routesManager.afterEachPreHandler.push(fn);
    }else if( eventNameInLower === "post"  || eventNameInLower === "posthandler" ){
        this.routesManager.afterEachPostHandler.push(fn);
    }else if( eventNameInLower === "each"  || eventNameInLower === "eachhandler"){
        this.routesManager.afterEachPreHandler.push(fn);
        this.routesManager.afterEachPostHandler.push(fn);
        this.routesManager.afterMainHandler.push(fn);
    }else if( eventNameInLower === "main" || eventNameInLower === "mainhandler"){
        this.routesManager.afterMainHandler.push(fn);
    }else{
        throw Error(`You've provided an invalid event name: ${handlerType}`);
    }
}