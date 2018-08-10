const YAML = require('yamljs');
const fs = require('fs');
const path = require('path');
var HttpAsked = require('./HttpAsked');
const HttpAnswer = require('./HttpAnswer');
const Runner = require('./HandlerRunner');
const logger = require("./fakeLogger");
const ApplicationSetupError = require('./ApplicationSetupError');
const profile = process.env.NODE_ENV;
var StreamMeter = require('./streamMeter');

function checkPath(filepath){
    if (!fs.existsSync(filepath)) {
        throw new ApplicationSetupError("Path for mapping files/folder should either be absolute or relative to project directory: " + filepath);
    }
}

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
        this.addRoute(routes[index].route);
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
    if(route.in && route.in.indexOf(profile) === -1) return; //skip mapping for other environments
    
    route =  Object.assign({},defaultRouteConfig,route);

    const context = {
        app: this.appContext,
        route: route
    };
    context.route.maxLength = context.route.maxLength || context.app.maxLength;

    //build the chain of handlers need to run for given route
    const handlerRunners = this.extractHandlersFromRoute(route);

    //read request body forcefully or as per method
    let mayHaveBody = this.appContext.alwaysReadRequestPayload || 
            ( route.when !== "GET" && route.when !== "HEAD" && route.when !== "UNLOCK" && route.when !== "PURGE" && route.when !== "COPY") ;

    this.eventEmitter.emit("addroute", context.route);
    this.router.on(route.when, route.uri, async ( nativeRequest, nativeResponse, params ) => {
        logger.log.debug(`Request Id:${nativeRequest.id}`, route);
        const asked = new HttpAsked(nativeRequest,params,context);
        asked._mayHaveBody = mayHaveBody;
        const answer = new HttpAnswer(nativeResponse,asked,this.containers,this.eventEmitter);
        
        if(asked.contentLength > route.maxLength){
            logger.log.debug(`Request Id:${asked.id} Calling __exceedContentLength handler`);
            this.eventEmitter.emit("fatBody",asked,answer);
            return;
        }else if(mayHaveBody){
            asked.stream = new StreamMeter({
                maxLength : context.route.maxLength,
                errorHandler : () => {
                    logger.log.debug(`Request Id:${asked.id} Calling __exceedContentLength handler`);
                    this.eventEmitter.emit("fatBody",asked,answer);
                }
            })
            nativeRequest.pipe(asked.stream);
        }

        nativeRequest.on('error', function(err) {
            answer.error = err;
            this.eventEmitter.emit("error",asked,answer);
        });

        this.eventEmitter.emit("route",asked,answer);
        try{

            for(let i=0; i<handlerRunners.length;i++){
                await handlerRunners[i].run(asked ,answer);
                if(answer.leave) break;
            }

            answer.end();	

        }catch(e){
            answer.error = e;
            //console.log(e);
            this.eventEmitter.emit("error",asked,answer);
        }
    })//router.on ends

    //this.eventEmitter.emit("afterAddRoute",context.route);
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
                reqHandler = this.handlers.get(reqHandler);
                if(!reqHandler) throw new ApplicationSetupError(`Unregistered handler ${fName}`);
            }else{
                fName = reqHandler.name;
            }

            handlerRunners.push(new Runner(fName, reqHandler.handle || reqHandler, beforeHandler, afterHandler));
        }
    }
}

function RoutesManager(appContext,containers,eventEmitter){
    this.appContext = appContext || {};

    this.eventEmitter = eventEmitter;
    this.containers = containers;
    this.handlers = containers.handlers;

    this.beforeEachPreHandler = [],  this.beforeMainHandler = [], this.beforeEachPostHandler = [];
    this.afterEachPreHandler = [],  this.afterMainHandler = [], this.afterEachPostHandler = [];

    this.router = require('anumargak')( {
        ignoreTrailingSlash: true,
        //maxParamLength: appContext.maxParamLength || 100,
        defaultRoute : (nativeRequest,nativeResponse) =>{
            const asked = new HttpAsked(nativeRequest,null,{
                route : defaultRouteConfig,
                app : appContext
            });
            const answer = new HttpAnswer(nativeResponse,asked,this.containers,this.eventEmitter);
            this.eventEmitter.emit("defaultRoute",asked,answer);
        }
    } );
}
module.exports = RoutesManager;