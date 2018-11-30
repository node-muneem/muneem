const YAML = require('yamljs');
const fs = require('fs');
const path = require('path');
var HttpAsked = require('./HttpAsked');
const HttpAnswer = require('./HttpAnswer');
const Runner = require('./HandlerRunner');
const logger = require("./fakeLogger");
const ApplicationSetupError = require('./ApplicationSetupError');
var StreamMeter = require('./streamMeter');

function checkPath(filepath){
    if (!fs.existsSync(filepath)) {
        throw new ApplicationSetupError("Path for mapping files/folder should either be absolute or relative to project directory: " + filepath);
    }
}

const methodsWithoutBody = [ "GET" , "HEAD" , "UNLOCK" , "PURGE" , "COPY"];

RoutesManager.prototype.addRoutesFromMappingsFile = function(filepath){
    checkPath(filepath);
    if(fs.lstatSync(filepath).isDirectory()){
        const files = fs.readdirSync(filepath);
        for(let index in files){
            const fPath = path.join(filepath,files[index]);
            if(!fs.lstatSync(fPath).isDirectory() && fPath.endsWith(".yaml")){
                this.readRoutesFromFile(fPath);
            }
        }
    }else{
        this.readRoutesFromFile(filepath);
    }

    if(this.router.count === 0){
        throw new ApplicationSetupError("There is no route exist. Please check the mapping file or add them from the code.");
    }else{
        logger.log.info(`${this.router.count}  routes are loaded.`);
    }
}

/**
 * Read routes mapping from a yaml file
 * @param {string} filepath 
 */
RoutesManager.prototype.readRoutesFromFile = function(filepath){
    let routes;
    try{
        routes = YAML.parseFile(filepath);
    }catch(e){
        logger.log.error( filepath + " is an invalid Yaml file or have syntax issues.");
        logger.log.error( e);
    }
    logger.log.info("reading "+ (routes && routes.length) +" routes from file " + filepath);
    routes && this.addRoutes(routes);
}

/**
 * Iterate through routes and add them
 * @param {Array} routes
 */
RoutesManager.prototype.addRoutes = function(routes){
    for(let index=0;index<routes.length;index++){
        this.addRoute( routes[index].route );
    }
}

const defaultRouteConfig = {
    when: "GET"
}

/* const dontHaveBody = ["GET", "HEAD"]
const mayHaveBody = ["POST", "PUT", "DELETE", "OPTION"] */

/**
 * Check a route mapping against the handlers added to muneem container.
 * Create routes with necessary handlers' calls
 * @param {object} route
 */
RoutesManager.prototype.addRoute = function(route){
    
    if(route.in && route.in.indexOf(this.store["app context"].env ) === -1) return; //skip mapping for other environments
    
    route =  Object.assign({},defaultRouteConfig,route);

    const routeContext = route;
    routeContext.maxLength = route.maxLength || this.store["app context"].maxLength;
    this.store["route context"] = routeContext;

    //build the chain of handlers need to run for given route
    const handlerRunners = this.extractHandlersFromRoute(route);

    
    let mayHaveBody =  methodsWithoutBody.indexOf(route.when) === -1;

    this.eventEmitter.emit("addRoute", routeContext);
    this.router.on(route.when, route.url, async ( nativeRequest, nativeResponse, store ) => {
        logger.log.debug(`Request Id:${nativeRequest.id}`, route);
        const asked = new HttpAsked(nativeRequest, store);
        asked._mayHaveBody = mayHaveBody;
        const answer = new HttpAnswer(nativeResponse,asked,this.containers,this.eventEmitter);
        
        if(asked.contentLength > route.maxLength){
            logger.log.debug(`Request Id:${asked.id} Calling __exceedContentLength handler`);
            this.eventEmitter.emit("fat-body-notify", asked);
            this.eventEmitter.emit("fat-body-handler", asked, answer);
            return;
        }else if(mayHaveBody){
            asked.stream = new StreamMeter({
                maxLength : routeContext.maxLength,
                errorHandler : () => {
                    logger.log.debug(`Request Id:${asked.id} Calling __exceedContentLength handler`);
                    this.eventEmitter.emit("fat-body-notify", asked);
                    this.eventEmitter.emit("fat-body-handler", asked, answer);
                }
            })
            asked.stream.headers = nativeRequest.headers; // So that custom plugins don't need native request
            nativeRequest.pipe(asked.stream);
        }

        const that = this;
        nativeRequest.on('error', function(err) {
            that.eventEmitter.emit("error-notify", err, asked);
            that.eventEmitter.emit("error-handler", err, asked, answer);
        });

        this.eventEmitter.emit("route",asked,answer);
        try{

            for(let i=0; i<handlerRunners.length;i++){
                if(answer.chain.skip > 0) {
                    answer.chain.skip--;
                    continue;
                }
                await handlerRunners[i].run(asked ,answer);
                if(answer.chain.skip === -1) break;
            }

            if( !answer.answered() ) answer.end();

        }catch(err){
            that.eventEmitter.emit("error-notify", err, asked);
            that.eventEmitter.emit("error-handler", err, asked, answer);
        }
    })//router.on ends
}

/**
 * Validate if the handlers sequence is correct. 
 * Find the handler's implementation against their name
 * @param {*} route 
 */
RoutesManager.prototype.extractHandlersFromRoute = function(route){
    const handlerRunners = [];

    //Prepare the list of handler need to be called before
    this.pushToHandlerRunners(route.after, this.beforeEachPreHandler, this.afterEachPreHandler, handlerRunners );
    this.pushToHandlerRunners(route.to, this.beforeMainHandler, this.afterMainHandler, handlerRunners );
    this.pushToHandlerRunners(route.then, this.beforeEachPostHandler, this.afterEachPostHandler, handlerRunners );

    return handlerRunners;
}

RoutesManager.prototype.pushToHandlerRunners = function(handlersList, beforeHandler, afterHandler, handlerRunners ){
    if(handlersList){
        if( !Array.isArray(handlersList) ){
            handlersList = [handlersList];
        }
        for(let i=0;i<handlersList.length;i++){
            var fName = "", reqHandler = handlersList[i];
            if(typeof reqHandler === "string"){
                fName = handlersList[i];
                reqHandler = this.handlers.get(reqHandler.toLowerCase());
                if(!reqHandler) throw new ApplicationSetupError(`Unregistered handler ${fName}`);
            }else{
                fName = reqHandler.name;
            }

            handlerRunners.push(new Runner(fName, reqHandler.handle || reqHandler, beforeHandler, afterHandler, this.store));
        }
    }
}

function RoutesManager(containers, eventEmitter, store){
    this.eventEmitter = eventEmitter;
    this.containers = containers;
    this.handlers = containers.handlers;
    this.store = store;

    this.beforeEachPreHandler = [],  this.beforeMainHandler = [], this.beforeEachPostHandler = [];
    this.afterEachPreHandler = [],  this.afterMainHandler = [], this.afterEachPostHandler = [];

    this.router = require('anumargak')( {
        ignoreTrailingSlash: true,
        defaultRoute : (nativeRequest, nativeResponse) =>{
            const asked = new HttpAsked(nativeRequest, null);
            const answer = new HttpAnswer(nativeResponse,asked,this.containers,this.eventEmitter);
            this.eventEmitter.emit("route-not-found-notify", asked);
            this.eventEmitter.emit("route-not-found-handler", asked, answer, (_name) => {
                //TODO : log the name of the handler with the resource _name
                return store[ _name ];
            });
        }
    } );
}
module.exports = RoutesManager;