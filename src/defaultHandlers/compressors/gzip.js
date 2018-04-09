var zlib = require('zlib');

module.exports = (asked,answer) => {
    if(Buffer.isBuffer(answer.data)){
        answer.replace(zlib.gzipSync(answer.data));
    }else{
        answer.replace(zlib.gzipSync(Buffer.from(answer.data)));
    }
    answer.setHeader('content-encoding','gzip');
}