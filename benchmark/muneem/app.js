const path = require("path");
//var uniqid = require('uniqid');

const Muneem = require("../../src/muneem");
//Muneem.setLogger(console);
//Muneem.logger.log.info("test internal logger")

Muneem.addToAnswer("justForFun", function(msg){
    this.data = "justforfun : " + msg;
} );

const muneem = Muneem({
    mappings : path.join(__dirname, "mappings.yaml"),
    //alwaysReadRequestPayload : true
});

muneem.addHandler("preStream", {
    handle : () => {}
}, { handlesStream : true});

muneem.addHandler("parallel", (req,answer) => {
    //console.log("parallel")
},{
    inParallel : true
});
muneem.addHandler("main", (req,answer) => {
    //answer.data = '{ "hello" : "world" }';
    answer.write('{ "hello" : "world" }');
    //answer.justForFun("test");
    //answer.justForFun("test");
    //console.log("main")
});
muneem.addHandler("post", (req,answer) => {
    //console.log("post")
});

/* muneem.beforeEachHandler(() => {
    //console.log("before")
}); */

const server = muneem.createServer({
    //idGenerator : uniqid
});
//console.log(muneem.routesManager.router.routes);
server.start();
