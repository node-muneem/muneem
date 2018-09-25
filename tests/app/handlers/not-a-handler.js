var add = require("./util");

module.exports = (asked,answer) => {
    answer.write( add("from ", "not a handler") );
}