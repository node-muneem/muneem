const stream = require( 'stream' );
const util = require( 'util' );

const Transform = stream.Transform;

module.exports = StreamMeter;

function StreamMeter( options ) {
    if ( !( this instanceof StreamMeter ) ) return new StreamMeter( options );

    Transform.call( this, options );
    this._curLength = 0;
    this._maxLength = options.maxLength;
    this._errorHandler = options.errorHandler;
}

util.inherits( StreamMeter, Transform );

StreamMeter.prototype._transform = function( chunk, enc, callback ) {
    this._curLength += chunk.length;
    if ( this._curLength > this._maxLength ) {
        this._errorHandler && this._errorHandler("exceeded maxlength");
        //this.emit( 'error', 'exceeded maxlength' );
        return;
    }
    this.push( chunk, enc );
    callback();
};