const Accept = require('accept');
const HandlersContainer = require("./HandlersContainer");

class SerializersContainer extends HandlersContainer{
    constructor(){
        super("serialize")
    }

    get(asked){
        const acceptHeader = asked.headers["accept"];
    
        if(!acceptHeader) return;
        let s = this.collection[acceptHeader];
        
        if(!s && acceptHeader.indexOf(",") !== -1){//multiple accept type
            const acceptTypes = Accept.mediaTypes(acceptHeader);
            for(let i=0;i<acceptTypes.length && !s;i++){
                s = this.collection[acceptTypes[i]];
            }
        }
    
        return s;
    }
}

module.exports = SerializersContainer;
