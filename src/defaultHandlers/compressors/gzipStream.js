var zlib = require('zlib');

module.exports = (asked,answer) => {
    answer.writeMore(zlib.createGzip());
}