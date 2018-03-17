
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
        this.handlesStream = options.handlesStream;
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
}

module.exports = Handler;