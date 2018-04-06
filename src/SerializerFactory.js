const Accept = require('accept');
const ApplicationSetupError = require('./ApplicationSetupError');

SerializerFactory.prototype.add = function(mimeType, serializer){
    if(typeof serializer === "function"){
        this.collection[mimeType] = serializer;
    }else if(typeof serializer.serialize === "function"){
        this.collection[mimeType] = serializer.serialize;
    }else{
        throw new ApplicationSetupError("Invalid serializer");
    }
}

SerializerFactory.prototype.get = function(asked){
    const acceptHeader = asked.headers["accept"];

    if(!acceptHeader) return this.collection["*/*"];
    let s = this.collection[acceptHeader];
    
    if(!s && acceptHeader.indexOf(",") !== -1){//multiple accept type
        const acceptTypes = Accept.mediaTypes(acceptHeader);
        for(let i=0;i<acceptTypes.length && !s;i++){
            s = this.collection[acceptTypes[i]];
        }
    }

    return s;
}

function SerializerFactory(){
    this.collection = {}
}

module.exports = SerializerFactory;