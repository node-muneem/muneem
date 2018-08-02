var zlib = require('zlib');

module.exports = (asked,answer) => {
    if(Buffer.isBuffer(answer.data)){
        answer.write ( zlib.gzipSync(answer.data) );
    }else{
        answer.write ( zlib.gzipSync( Buffer.from(answer.data) ) );
    }
    answer.setHeader('content-encoding','gzip');
}