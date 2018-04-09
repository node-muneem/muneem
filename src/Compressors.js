const Accept = require('accept');
const { checkIfValidHandler } = require('./appUtil');

Compressors.prototype.add = function(mimeType, compressor){
    if(typeof compressor === "function"){
        this.collection[mimeType] = compressor;
    }else if(typeof compressor.serialize === "function"){
        this.collection[mimeType] = compressor.serialize;
    }else{
        throw new ApplicationSetupError("Invalid compressor");
    }
}

Compressors.prototype.get = function(asked){
    const acceptEncodingHeader = asked.headers["accept-encoding"];
    
    if( !acceptEncodingHeader ) return this.collection["*"];//apply default compression
    let s = this.collection[ acceptEncodingHeader ];//if only one compression technique is given
    
    if(!s && acceptEncodingHeader.indexOf(",") !== -1){//multiple acceptable compression technique 
        let preference = "";
        if(typeof asked.context.route.compress === "string" || Array.isArray(asked.context.route.compress)){
            preference = asked.context.route.compress;
        }else if(typeof asked.context.route.compress === "object"){
            preference = asked.context.route.compress.preference;
        }else {
            //don't set preference
        }
        const acceptTypes = Accept.mediaTypes( acceptEncodingHeader ,preference);
        for(let i=0;i<acceptTypes.length && !s;i++){
            s = this.collection[acceptTypes[i]];
        }
    }

    return s;
}

function Compressors(){
    this.collection = {}
}

module.exports = Compressors;