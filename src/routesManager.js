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
    this.updateCompressOptions(context);

    //build the chain of handlers need to run for given route
    const handlerRunners = this.extractHandlersFromRoute(route);

    //read request body forcefully or as per method
    let mayHaveBody = this.appContext.alwaysReadRequestPayload || 
            ( route.when !== "GET" && route.when !== "HEAD" && route.when !== "UNLOCK" && route.when !== "PURGE" && route.when !== "COPY") ;

    const bigBodyAlert = this.handlers.get("__exceedContentLength").handle || this.handlers.get("__exceedContentLength");
    const errorHandler = this.handlers.get("__error").handle || this.handlers.get("__error");

    this.router.on(route.when,route.uri, async (nativeRequest,nativeResponse,params) => {
        logger.log.debug(`Request Id:${nativeRequest.id}`, route);
        const asked = new HttpAsked(nativeRequest,params,context);
        asked._mayHaveBody = mayHaveBody;
        const answer = new HttpAnswer(nativeResponse,asked,this.containers);
        
        if(asked.contentLength > route.maxLength){
            logger.log.debug(`Request Id:${asked.id} Calling __exceedContentLength handler`);
            bigBodyAlert(asked,answer);
            return;
        }else if(mayHaveBody){
            asked.stream = new StreamMeter({
                maxLength : context.route.maxLength,
                errorHandler : () => {
                    logger.log.debug(`Request Id:${asked.id} Calling __exceedContentLength handler`);
                    bigBodyAlert(asked,answer);
                }
            })
            nativeRequest.pipe(asked.stream);
        }

        nativeRequest.on('error', function(err) {
            answer.error = err;
            errorHandler(asked,answer);
        });

        try{

            for(let i=0; i<handlerRunners.length;i++){
                await handlerRunners[i].run(asked ,answer);
                if(answer.leave) break;
            }

            answer.end();	

        }catch(e){
            answer.error = e;
            //console.log(e)
            errorHandler(asked,answer);
        }
    })//router.on ends
}

RoutesManager.prototype.updateCompressOptions = function (context){
    if(context.route.compress === 'undefined'){
        if(context.app.compress.shouldCompress){
            context.route.compress = context.app.compress;
        }else{
            context.route.compress = false;
        }
        //TODO: need not to test for every route
        
        checkIfRegistered(this.containers,context.app.compress.preference);
    }else if(context.route.compress === false){
        //let it be false
    }else{
        context.route.compress =  Object.assign({},context.app.compress,context.route.compress);

        checkIfRegistered(this.containers,context.route.compress.preference);
    }
}

/**
 * Check if given compression preference is registered
 * @param {*} containers 
 * @param {*} preference 
 */
function checkIfRegistered(containers,preference){
    if(preference){
        const compressorPreference = containers.compressors.checkIfAllRegistered(preference);
        const streamCompressorPreference = containers.streamCompressors.checkIfAllRegistered(preference);
    
        if(!compressorPreference && !streamCompressorPreference){
            throw new ApplicationSetupError(`Unregistered compression type is set in preference : ${preference}`);
        }
    }
}

/**
 * Validate if the handlers sequence is correct. 
 * Find the handler's implementation against their name
 * @param {*} route 
 */
RoutesManager.prototype.extractHandlersFromRoute = function(route){
    const handlerRunners = [];

    //Prepare the list of handler need to be called before
    if(route.after){
        if(typeof route.after === "string"){
            route.after = [route.after];
        }
        for(let i=0;i<route.after.length;i++){
            const handler = this.handlers.get(route.after[i]);
            if(!handler) throw new ApplicationSetupError(`Unregistered handler ${route.after[i]}`);

            handlerRunners.push(new Runner(route.after[i],handler.handle || handler,this.beforeEachPreHandler,this.afterEachPreHandler));
        }
    }
    if(route.to){
        const handler = this.handlers.get(route.to);
        handlerRunners.push(new Runner(route.to,handler.handle || handler,this.beforeMainHandler,this.afterMainHandler));
    }

    //Prepare the list of handler need to be called after
    if(route.then){
        if(typeof route.then === "string"){
            route.then = [route.then];
        }
        for(let i=0;i<route.then.length;i++){
            const handler = this.handlers.get(route.then[i]);
            if(!handler) throw new ApplicationSetupError(`Unregistered handler ${route.then[i]}`);
           
            handlerRunners.push(new Runner(route.then[i],handler.handle || handler ,this.beforeEachPostHandler,this.afterEachPostHandler));
        }
    }

    return handlerRunners;
}

function RoutesManager(appContext,containers){
    this.appContext = appContext || {};

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
            const answer = new HttpAnswer(nativeResponse,asked,this.containers);
            const defaultHandler = containers.handlers.get("__defaultRoute");
            if(defaultHandler.handle){
                defaultHandler.handle(asked,answer);
            } else {
                defaultHandler(asked,answer);
            }
        }
    } );
}
module.exports = RoutesManager;