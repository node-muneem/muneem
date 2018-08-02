var zlib = require('zlib');
var pump = require('pump');

module.exports = (asked,answer) => {
    answer.write( pump(answer.data, zlib.createDeflate() ) );
}