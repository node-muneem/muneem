const Accept = require('accept');
const { checkIfValidHandler } = require('./appUtil');

Compressors.prototype.add = function(mimeType, compressor){
    if(typeof compressor === "function"){
        this.collection[mimeType] = compressor;
    }else if(typeof compressor.compress === "function"){
        this.collection[mimeType] = compressor.compress;
    }else{
        throw new ApplicationSetupError("Invalid compressor");
    }
}

Compressors.prototype.get = function(asked,preference){
    const acceptEncodingHeader = asked.headers["accept-encoding"];
    
    if( !acceptEncodingHeader ) return;
    let c = this.collection[ acceptEncodingHeader ];//if only one compression technique is given
    
    if(!c && acceptEncodingHeader.indexOf(",") !== -1){//multiple acceptable compression technique 
        const acceptTypes = Accept.encodings( acceptEncodingHeader ,preference);
        for(let i=0;i<acceptTypes.length && !c;i++){
            c = this.collection[acceptTypes[i]];
        }
    }

    return c;
}

/**
 * Check ig given preference is registered before registering the route
 * @param {string | Array} compressionPreference 
 */
Compressors.prototype.checkIfAllRegistered = function(compressionPreference){
    if(typeof compressionPreference === "string"){
        return this.isRegistered(compressionPreference);
    }else if(Array.isArray(compressionPreference)){
        for(let i=0; i< compressionPreference.length;i++){
            if(!this.isRegistered(compressionPreference[i])){
                return false;
            }
        }
    }
}
Compressors.prototype.isRegistered = function(compressionType){
    return this.collection[compressionType];
}

function Compressors(){
    this.collection = {}
}

module.exports = Compressors;