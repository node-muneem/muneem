const YAML = require('yamljs');
const fs = require('fs');
const path = require('path');
var HttpAsked = require('./HttpAsked');
const HttpAnswer = require('./HttpAnswer');
const Runner = require('./HandlerRunner');
const logger = require("./fakeLogger");
const ApplicationSetupError = require('./ApplicationSetupError');
const profile = process.env.NODE_ENV;

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
        logger.log.info(this.router.count + " routes are loaded.");
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

/* const dontHaveBody = ["GET", "HEAD"]
const mayHaveBody = ["POST", "PUT", "DELETE", "OPTION"] */

/**
 * Check a route mapping against the handlers added to muneem container.
 * Create routes with necessary handlers' calls
 * @param {object} route
 */
RoutesManager.prototype.addRoute = function(route){
    const THIS = this;
    if(route.in && route.in.indexOf(profile) === -1) return; //skip mapping for other environments
    const context = {
        app: this.appContext,
        route: route
    };
    route.when = route.when || "GET";//set default
    route.maxLength = route.maxLength || 1e6; //set 1mb default

    const routeHandlers = this.extractHandlersFromRoute(route);

    //read request body when there is at least one handler to handle it
    let readBody = this.appContext.alwaysReadRequestPayload || 
            ( routeHandlers.method !== "GET" && routeHandlers.method !== "HEAD");

    

    this.router.on(route.when,route.uri, function(nativeRequest,nativeResponse,params){

        const ans = new HttpAnswer(nativeResponse);
        const asked = new HttpAsked(nativeRequest,params);

        nativeRequest.on('error', function(err) {
            ans.error = err;
            THIS.handlersrs.get("__error").handle(asked,ans);
        });

        try{
            logger.log.debug(asked," matched with ", route);
            
            //operation on request stream
            for(let i=0; i<routeHandlers.preStreamHandlers.length;i++){
                routeHandlers.preStreamHandlers[i].runNonStreamHandler(asked ,ans, context);
                if(ans.answered())  return;
            }

            if(readBody){
                if(routeHandlers.streamHandler.before){
                    logger.log.debug(asked,"Executing request data stream handler's before()");
                    routeHandlers.streamHandler.before(asked,ans, context);
                    if(ans.answered()) asked.nativeRequest.removeAllListeners();
                }
                const bigBodyAlert = THIS.handlers.get("__exceedContentLength").handle;
                readRequestBody(asked, ans, routeHandlers, context, bigBodyAlert);
                nativeRequest.on('end', function() {

                    if(routeHandlers.streamHandler.after){
                        logger.log.debug(asked,"Executing request data stream handler's after()");
                        routeHandlers.reqDataStreamHandler.after(asked,ans, context);
                        if(ans.answered())  return;
                    }else{
                        //TODO: ask user if he wants buffer or string
                        asked.body = asked.body || Buffer.concat(asked.body);
                        logger.log.debug("Request " + asked.id + " Payload size: " + asked.body.length);
                    }

                    atEnd(asked,ans,routeHandlers,context)
                })
            }else{
                atEnd(asked,ans,routeHandlers,context)
            }
            
        }catch(e){
            ans.error = e;
            ans.context = context;
            THIS.handlers.get("__error").handle(asked,ans);
            //console.log(e)
        }
    })//router.on ends
}

/**
 * execute post handlers
 * @param {*} asked : request wrapper
 * @param {*} ans  : response wrapper
 * @param {*} routeHandlers : handlers attached to this route
 * @param {*} context : combination of app options and route mapping
 */
function atEnd(asked,ans,routeHandlers,context){
    
    for(let i=0; i<routeHandlers.postStreamHandlers.length;i++){
        routeHandlers.postStreamHandlers[i].runNonStreamHandler(asked,ans, context);
        if(ans.answered()) return;
    }

    if(!ans.answered()){//To confirm if some naughty postHandler has already answered
        if(ans.data && ans.data.pipe && typeof ans.data.pipe === "function"){//stream
            logger.log.debug(asked,"Responding back to client with stream");
            ans.data.pipe(nativeResponse);
        }else{
            if(ans.data !== undefined){
                if(typeof ans.data !== "string" && !Buffer.isBuffer(ans.data)){
                    logger.log.warn("Sorry!! Only string, buffer, or stream can be sent in response.");
                    logger.log.warn("Attempting JSON.stringify to transform Object to string");
                    ans.data = JSON.stringify(ans.data);
                }
            }
            ans.end();	
        }
    }

}

/**
 * If there is a stream handler attached to current route then call it on when request payload chunks are received.
 * If there is no stream handler and data handler then there is no need to read the request body
 * @param {*} nativeRequest 
 * @param {*} asked 
 * @param {*} ans 
 * @param {*} routeHandlers 
 */
const readRequestBody = function(asked, ans, routeHandlers, context, bigBodyAlert){

    /* const contentLen = asked.getHeader("content-length") || 0;
    const maxLength = contentLen > route.maxLength ? contentLen : route.maxLength ; */

    let contentLength = 0;

    logger.log.debug(asked,"Before reading request payload/body");
    asked.nativeRequest.on('data', function(chunk) {
        if(contentLength < route.maxLength){
            contentLength += chunk.length;
            routeHandlers.reqDataStreamHandler.runStreamHandler(chunk);
        }else{
            //User may want to take multiple decisions instead of just refusing the request and closing the connection
            logger.log.debug(asked,"Calling __exceedContentLength handler");
            bigBodyAlert(asked,ans, context);
        }
    });

}

function defaultStreamHandler(){
    this.before = asked => {this.asked = asked};
    this.handle = chunk => { this.asked.body.push(chunk) };
} 

/**
 * Validate if the handlers sequence is correct. 
 * Find the handler's implementation against their name
 * @param {*} route 
 * @param {*} handlers 
 * @param {*} appContext 
 */
RoutesManager.prototype.extractHandlersFromRoute = function(route){
    const routeHandlers = {
        preStreamHandlers : [],
        streamHandler: undefined,
        postStreamHandlers : [],
    }

    //Prepare the list of handler need to be called before
    if(route.after){
        for(let i=0;i<route.after.length;i++){
            const handler = this.handlers.get(route.after[i]);
            if(!handler) throw new ApplicationSetupError("Unregistered handler " + route.after[i]);

            //User should not set stream handler for GET/HEAD request
            if(!this.appContext.alwaysReadRequestPayload && handler.handlesStream
                && (route.when === "GET" || route.when === "HEAD")
                ){
                throw new ApplicationSetupError("Set alwaysReadRequestPayload if you want to read request body/payload for GET and HEAD methods (which is not idle)");
            }

            if(handler.handlesStream){
                if(routeHandlers.streamHandler){
                    throw new ApplicationSetupError("MappingError: There is only one request stream handler per mapping allowed.");
                }else{
                    routeHandlers.streamHandler = new Runner(handler,this.beforeEachPreHandler,this.afterEachPreHandler);
                }
            }else if(routeHandlers.streamHandler){
                routeHandlers.postStreamHandlers.push(new Runner(handler,this.beforeEachPostHandler,this.afterEachPostHandler));
            }else{
                routeHandlers.preStreamHandlers.push(new Runner(handler,this.beforeEachPreHandler,this.afterEachPreHandler));
            }
        }//end of loop
    }

    if(route.to){
        const handler = this.handlers.get(route.to);
        if(handler.handlesStream){
            if(routeHandlers.streamHandler){
                throw new ApplicationSetupError("MappingError: There is only one request stream handler per mapping allowed.");
            }else{
                routeHandlers.streamHandler = new Runner(handler,this.beforeMainHandler,this.afterMainHandler);
            }
        }else{
            routeHandlers.postStreamHandlers.push(new Runner(handler,this.beforeMainHandler,this.afterMainHandler));
        }
    }

    if(!routeHandlers.streamHandler){
        routeHandlers.streamHandler = new Runner(new defaultStreamHandler());
    }

    //Prepare the list of handler need to be called after
    if(route.then){
        for(let i=0;i<route.then.length;i++){
            const handler = this.handlers.get(route.then[i]);
            if(!handler) throw new ApplicationSetupError("Unregistered handler " + route.then[i]);

            if(handler.handlesStream){
                throw new ApplicationSetupError("Ah! wrong place for " + route.then[i] + ". Only response handlers are allowed.");
            }else{
                routeHandlers.postStreamHandlers.push(new Runner(handler,this.beforeEachPostHandler,this.afterEachPostHandler));
            }
        }
    }

    return routeHandlers;
}

/**
 * 
 * @param {Array} arrayOfFunctions 
 */
function callAll(arrayOfFunctions, ...args){
    for(let i=0; i < arrayOfFunctions.length; i++){
        arrayOfFunctions[i](...args);
    }
}

function RoutesManager(appContext,map){
    this.appContext = appContext;
    this.handlers = map;

    this.beforeEachPreHandler = [],  this.beforeMainHandler = [], this.beforeEachPostHandler = [];
    this.afterEachPreHandler = [],  this.afterMainHandler = [], this.afterEachPostHandler = [];

    //this.router = require('find-my-way')( {
    this.router = require('anumargak')( {
        ignoreTrailingSlash: true,
        //maxParamLength: appContext.maxParamLength || 100,
        defaultRoute : (nativeRequest,nativeResponse) =>{
            const answer = new HttpAnswer(nativeResponse);
            const asked = new HttpAsked(nativeRequest);
            map.get("__defaultRoute").handle(asked,answer);
        }
    } );
}
module.exports = RoutesManager;