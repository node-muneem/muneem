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
        if(typeof s.serializer === "function"){
            return s;
        }else if(s.serializer.getInstnace){
            const serialzer = s.serializer.getInstnace(s.options,asked);
            return serialzer.serialize;
        }else{
            return s.serialize;
        }
    }else{//no serializer is registered to handle given accept media type
        //return defaultSerializer;
    }
}

function SerializerFactory(){
    this.collection = {}
}

module.exports = SerializerFactory;