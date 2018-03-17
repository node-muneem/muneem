const YAML = require('yamljs');
const fs = require('fs');
const path = require('path');
const HttpAnswer = require('./HttpAnswer');


/**
 * Read files from a directory
 */
const ls = function(dirpath){
	if(exports.isExist(dirpath)){
		return fs.readdirSync(dirpath);
	}
	return [];
}

function getFilePath(filepath){
    if (fs.existsSync(filepath)) {
        return filepath;
    }

    filepath = path.join(process.cwd() , filepath);
    if (fs.existsSync(filepath)) {
        return filepath;
    }

    throw Error("Path for mapping files/folder should either be absolute or relative to project directory.")
}

const mapRoutes = function(router,filepath,handlers,profile){
    filepath = getFilePath(filepath);
    if(fs.lstatSync(filepath).isDirectory()){
        const files = ls(filepath);
        for(let file in files){
            loadFrom(router,file,handlers,profilefile);
        }
    }else{
        loadFrom(router,filepath,handlers,profile);
    }
}

/**
 * Read routes mapping from given path and set router with appropriate actions
 * @param {string} path 
 */
const loadFrom = function(router,filepath,handlers,profile){
    const routes = YAML.parseFile(filepath);
    const len = routes.length;
    //TODO : log total mappings
    for(let index=0;index<len;index++){
        const route = routes[index].route;
        if(route.in && route.in.indexOf(profile) === -1){
            continue; //skip mapping for other environments
        }else{
            let streamHandlers = [],  preHandlers = [], postHandlers = [];

            if(route.after){
                for(let i=0;i<route.after.length;i++){
                    const handler = handlers.get(route.after[i]);
                    if(!handler) throw Error("Unregistered handler " + router.after[i]);

                    if(handler.handlesStream){
                        if(preHandlers.length > 0){
                            throw Error("MappingError: stream handlers should be called before.")
                        }else{
                            streamHandlers.push(handler);
                        }
                    }else{
                        preHandlers.push(handler);
                    }
                }
            }

            if(route.then){
                for(let i=0;i<route.then.lengtha_len;i++){
                    const handler = handlers.get(route.then[i]);
                    if(!handler) throw Error("Unregistered handler " + route.then[i]);

                    postHandlers.push(handler);
                }
            }
            route.when = route.when || "GET";

            router.on(route.when,route.uri, function(req,res,params){
                res.statusCode = 200;
                const ans = new HttpAnswer(res);
                //operation on request stream
                for(let i=0; i<streamHandlers.length;i++){
                    streamHandlers[i].handle(req/* ,ans */,params,route/* , ...streamHandlers[i].with */);
                }

                let body = [];
                req.on('error', function(err) {
                    //logger.error(msg);
                }).on('data', function(chunk) {
                    body.push(chunk);
                }).on('end', function() {
                    req.body = Buffer.concat(body).toString();

                    //operation on request body
                    for(let i=0; i<preHandlers.length;i++){
                        preHandlers[i].handle(req/* ,ans */,params,route/* , ...preHandlers[i].with */);
                    }
                    
                    handlers.get(route.to).handle(req,ans,params,route/* , ...handler(route.to).with */);

                    //operation on respoonse
                    for(let i=0; i<postHandlers.length;i++){
                        if(ans.sent()){
                            break;
                        }
                        postHandlers[i].handle(req,ans,params,route/* , ...postHandlers[i].with */);
                    }

                    if(!ans.sent()){//To confirm if some naughty postHandler has already answered
                        if(ans.stream){
                            ans.stream.pipe(res);
                        }else{
                            if(ans.data)
                                res.write(ans.data, ans.encoding);	
                            res.end();	
                        }
                    }

                })//request event handler end
            })//router ends
        }
    }
}

exports.mapRoutes = mapRoutes;