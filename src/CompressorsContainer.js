const Accept = require('accept');
const HandlersContainer = require("./HandlersContainer");

class CompressorsContainer extends HandlersContainer{
    constructor(){
        super("compress")
    }

    get(asked,preference){
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
     * @param {Array} compressionPreference 
     */
    checkIfAllRegistered(compressionPreference){
        for(let i=0; i< compressionPreference.length;i++){
            if(!this.isRegistered(compressionPreference[i])){
                return false;
            }
        }
        return true;
    }

    
    isRegistered(compressionType){
        return this.collection[compressionType];
    }
}

module.exports = CompressorsContainer;