const YAML = require('yamljs');
const fs = require('fs');
const path = require('path');
var url = require('url');
const HttpAnswer = require('./HttpAnswer');
const profile = process.env.NODE_ENV;

function checkPath(filepath){
    if (!fs.existsSync(filepath)) {
        throw Error("Path for mapping files/folder should either be absolute or relative to project directory: " + filepath)
    }
}

RoutesManager.prototype.addRoutesFromMappingsFile = function(filepath){
    checkPath(filepath);
    if(fs.lstatSync(filepath).isDirectory()){
        const files = fs.readdirSync(filepath);
        for(let index in files){
            const fPath = path.join(filepath,files[index]);
            if(!fs.lstatSync(fPath).isDirectory() && fPath.endsWith(".yaml")){
                const routes = readRoutesFromFile(fPath);
                routes && this.loadRoutesFrom(routes);
            }
        }
    }else{
        const routes = readRoutesFromFile(filepath);
        routes && this.loadRoutesFrom(routes);
    }
}

/**
 * Read routes mapping from a yaml file
 * @param {string} filepath 
 */
function readRoutesFromFile(filepath){
    try{
        //TODO : log total mappings
        return YAML.parseFile(filepath);
    }catch(e){
        //TODO: use logger
        console.log( filepath + " is an invalid Yaml file or have syntatx issues.");
        console.log( e);
    }
}

/**
 * Iterate through routes and add them
 * @param {Array} routes
 */
RoutesManager.prototype.loadRoutesFrom = function(routes){
    for(let index=0;index<routes.length;index++){
        const route = routes[index].route;
        if(route.in && route.in.indexOf(profile) === -1){
            continue; //skip mapping for other environments
        }else{
            this.addRoute(route);
        }
    }
}

/**
 * Check a route mapping against the handlers added to muneem container.
 * Create routes with necessary handlers' calls
 * @param {object} routes
 */
RoutesManager.prototype.addRoute = function(route){
    const context = {
        app: this.appContext,
        route: route
    };
    route.when = route.when || "GET";//set default
    route.maxLength = route.maxLength || 1e6; //set 1mb default

    const routeHandlers = this.extractHandlersFromRoute(route);

    //read request body when there is at least one handler to handle it
    const readRequestBody = routeHandlers.reqDataHandlers.length > 0 
            || (routeHandlers.mainHandler && routeHandlers.mainHandler.type === "requestData");

    this.router.on(route.when,route.uri, function(nativeRequest,nativeResponse,params){
        //console.log("mapping found")
        const ans = new HttpAnswer(nativeResponse);
        const asked = buildRequestWrapper(nativeRequest,params);
        
        //operation on request stream
        for(let i=0; i<routeHandlers.reqHandlers.length;i++){
            routeHandlers.reqHandlers[i].handle(asked ,ans, context);
            if(ans.answered())  return;
        }

        nativeRequest.on('error', function(err) {
            //logger.error(msg);
        });
        //console.log("before handling stream")
        handleRequestPayloadStream(nativeRequest, asked, ans, routeHandlers, readRequestBody,context);
        //console.log("after handling stream")
        
        nativeRequest.on('end', function() {
            //TODO: do the conversion on demand
            //nativeRequest.rawBody = Buffer.concat(body);
            //console.log("inside end event")

            if(routeHandlers.reqDataStreamHandler && routeHandlers.reqDataStreamHandler.after){
                routeHandlers.reqDataStreamHandler.after(asked,ans, context);
                if(ans.answered())  return;
            }else{
                asked.body = asked.body || Buffer.concat(asked.body);
            }

            //operation on request body
            for(let i=0; i<routeHandlers.reqDataHandlers.length;i++){
                routeHandlers.reqDataHandlers[i].handle(asked ,ans, context);
                if(ans.answered())  return;
            }
            
            if(routeHandlers.mainHandler) {
                //console.log("calling route.to ");
                routeHandlers.mainHandler.handle(asked,ans, context);
                if(ans.answered()) return;
            }

            //operation on respoonse
            for(let i=0; i<routeHandlers.resHandlers.length;i++){
                //console.log("calling route.then ");
                routeHandlers.resHandlers[i].handle(asked,ans, context);
                if(ans.answered()) return;
            }

            if(!ans.answered()){//To confirm if some naughty postHandler has already answered
                if(ans.data && ans.data.pipe && typeof ans.data.pipe === "function"){//stream
                    ans.data.pipe(nativeResponse);
                }else{
                    if(ans.data !== undefined){
                        if(typeof ans.data !== "string" && !Buffer.isBuffer(ans.data)){
                            //TODO: report to logger
                            console.log("Sorry!! Only string, buffer, or stream is expected to send as a response.");
                            console.log("Hint! check mapping ", JSON.stringify(route,null,4));
                        }else{

                            if (!ans.getHeader('Content-Length') || !ans.getHeader('content-length')) {
                                ans.setHeader('Content-Length', '' + Buffer.byteLength(ans.data));
                            }

                            nativeResponse.write(ans.data, ans.encoding);	
                        }
                    }
                    nativeResponse.end();	
                }
            }

        })//request event handler end
    })//router.on ends
}

/**
 * If there is a stream handler attached to current route then call it on when request payload chunks are received.
 * If there is no stream handler and data handler then there is no need to read the request body
 * @param {*} nativeRequest 
 * @param {*} wrappedRequest 
 * @param {*} ans 
 * @param {*} routeHandlers 
 */
function handleRequestPayloadStream(nativeRequest, wrappedRequest, ans, routeHandlers, readRequestBody, context){

    let contentLength = 0;
    if(routeHandlers.reqDataStreamHandler){
        if(routeHandlers.reqDataStreamHandler.before){
            routeHandlers.reqDataStreamHandler.before(wrappedRequest,ans, context);
            if(ans.answered()) nativeRequest.removeAllListeners();
        }

        nativeRequest.on('data', function(chunk) {
                routeHandlers.reqDataStreamHandler.handle(chunk);
                if(ans.answered()){
                    nativeRequest.removeAllListeners();
                    //nativeRequest.removeListener('data', dataListener)
                    //nativeRequest.removeListener('end', endListener)
                }  
        })
    }else if(readRequestBody){
        nativeRequest.on('data', function(chunk) {
            if(contentLength < route.maxLength){
                contentLength += chunk.length;
                req.body.push(chunk);//TODO: ask user if he wants Buffer array
            }else{
                //User may want to take multiple decisions instead of just refusing the request and closing the connection
                this.handlers.get("__exceedContentLength").handle(wrappedRequest,ans, context);
            }
        })  
    }else{
        //Don't read the request body
    }
}

function buildRequestWrapper(request,params){
    var parsedURL = url.parse(request.url, true);
    return {
        url: parsedURL.pathname,
        query : parsedURL.query,
        params : params,
        nativeRequest : request,
        body: []
    }
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
        reqHandlers : [],
        reqDataStreamHandler: undefined,
        reqDataHandlers : [],
        resHandlers : [],
        mainHandler: undefined
    }

    //Prepare the list of handler need to be called before
    if(route.after){
        for(let i=0;i<route.after.length;i++){
            const handler = this.handlers.get(route.after[i]);
            if(!handler) throw Error("Unregistered handler " + route.after[i]);

            if((route.when === "GET" || route.when === "HEAD") 
                && (handler.type === "requestDataStream" || handler.type === "requestData") 
                && !this.appContext.alwaysReadRequestPayload){
                throw Error("Set alwaysReadRequestPayload if you want to read request body/payload for GET and HEAD methods");
            }

            if(handler.type === "requestDataStream"){
                if(routeHandlers.reqDataHandlers.length > 0){
                    throw Error("MappingError: Request Stream handler should be called before.");
                }else if(routeHandlers.reqDataStreamHandler){
                    throw Error("MappingError: There is only one request stream handler per mapping allowed.");
                }else{
                    routeHandlers.reqDataStreamHandler = handler;
                }
            }else if(handler.type === "requestData"){
                routeHandlers.reqDataHandlers.push(handler);
            }else/*   if(handler.type === "request") */{
                routeHandlers.reqHandlers.push(handler);
            }
        }
    }

    //Prepare the list of handler need to be called after
    if(route.then){
        for(let i=0;i<route.then.length;i++){
            const handler = this.handlers.get(route.then[i]);
            if(!handler) throw Error("Unregistered handler " + route.then[i]);
            else if(handler.type !== "response"){
                throw Error("Ah! wrong place for " + route.then[i] + ". Only response handlers are allowed here.");
            }
            routeHandlers.resHandlers.push(handler);
        }
    }

    if(route.to){
        const mainHandler = this.handlers.get(route.to);
        if(mainHandler.type === "requestDataStream"){
            if(routeHandlers.reqDataStreamHandler){
                throw Error("MappingError: There is only one request stream handler per mapping allowed.");
            }else{
                routeHandlers.reqDataStreamHandler = mainHandler;
                routeHandlers.mainHandler  = undefined;
            }
        }else{
            routeHandlers.mainHandler = mainHandler;
        }
    }
        
    return routeHandlers;
}


function RoutesManager(appContext,handlers){
    this.appContext = appContext;
    this.handlers = handlers;
    //console.log(handlers);
    this.router = require('find-my-way')( {
        ignoreTrailingSlash: true,
        maxParamLength: appContext.maxParamLength || 100,
        defaultRoute : (nativeRequest,nativeResponse) =>{
            const answer = new HttpAnswer(nativeResponse);
            const asked = buildRequestWrapper(nativeRequest);
            handlers.get("__defaultRoute").handle(asked,answer);
        }
    } );
}
module.exports = RoutesManager;