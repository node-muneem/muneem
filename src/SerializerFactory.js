const Accept = require('accept');

SerializerFactory.prototype.add = function(mimeType, serializer,options){
    this.collection[mimeType] = { serializer : serializer, options : options };
}

SerializerFactory.prototype.get = function(asked){
    const acceptTypes = Accept.mediaTypes(asked.headers["accept"]);
    let s;
    for(let i=0;i<acceptTypes.length && !s;i++){
        s = this.collection[acceptTypes[i]];
    }

    if(s){
        if(s.serializer.serialize){
            return s.serializer.serialize;
        }else {
            return s.serializer;
        }
    }else{//no serializer is registered to handle given accept media type
        //return defaultSerializer;
    }
}

function SerializerFactory(){
    this.collection = {}
}

module.exports = SerializerFactory;