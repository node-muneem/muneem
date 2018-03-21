var stream = require('stream');

function isReadableStream(obj) {
    return obj instanceof stream.Stream &&
      typeof (obj._read === 'function') &&
      typeof (obj._readableState === 'object');

    //return obj instanceof stream.Writable;
  }

  function isWritableStream(obj) {
    return obj instanceof stream.Stream &&
      typeof (obj._write === 'function') &&
      typeof (obj._writableState === 'object');
  }

  function isStream(obj){
      return isReadableStream(obj) || isWritableStream(obj);
  }

const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
exports.randomId = function (len){
    len = len || 16;
    for( var i=0; i < len; i++ )
        text += charset.charAt(Math.floor(Math.random() * 62));
    return text;
}