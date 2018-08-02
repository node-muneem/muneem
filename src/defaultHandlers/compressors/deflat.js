var zlib = require('zlib');

module.exports = (asked,answer) => {
    if(Buffer.isBuffer(answer.data)){
        answer.write( zlib.deflateSync(answer.data));
    }else{
        answer.write( zlib.deflateSync(Buffer.from(answer.data) ) );
    }
    answer.setHeader('content-encoding','deflate');
}