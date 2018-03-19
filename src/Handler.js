
const types = ["request", "requestDataStream", "requestData", "response"];
/**
 * A handler can handle request, requestDataStream, requestData, or response
 * @param {string} type 
 */
Handler.prototype.toHandle = function(type){
    if(types.indexOf(type) === -1){
        throw Error("Invalid type " + type);    
    }

    /* if(type !== "request" && this.inParallel){
        throw Error( type + " handler are not allowed to run side by side");
    } */
    this.type = type;
}

Handler.prototype.setHandler = function(handler){
    if(this.inParallel){
        this.handle =  function(){ 
            const args = arguments; 
            setTimeout(
                function(){
                    handler(...args)
                }
            ,0)
        };
    }else{
        this.handle = handler;
    }
}

function Handler(handler, options){
    if(options){
        //this.handlesStream = options.handlesStream;
        this.inParallel = options.inParallel;
    }

    if(typeof handler === "function" ){
        this.setHandler(handler)
    }else if(typeof handler === "object"){
        if(handler.handle){
            this.setHandler(handler.handle);
        }else{
            throw Error("Handler should have 'handle' method.");    
        }
    }else{
        throw Error("Handler should be of object or function type only.");
    }

    this.type = "requestData";
}

module.exports = Handler;