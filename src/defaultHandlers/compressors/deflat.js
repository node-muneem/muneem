var zlib = require('zlib');

module.exports = (asked,answer) => {
    if(Buffer.isBuffer(answer.data)){
        answer.replace(zlib.deflateSync(answer.data));
    }else{
        answer.replace(zlib.deflateSync(Buffer.from(answer.data)));
    }
    answer.setHeader('content-encoding','deflate');
}