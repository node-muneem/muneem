const path = require("path");

const Muneem = require("../../src/muneem");

Muneem.addToAnswer("justForFun", function(msg){
    this.data = "justforfun : " + msg;
} );

const muneem = Muneem({
    mappings : path.join(__dirname, "mappings.yaml"),
    alwaysReadRequestPayload : true
});

muneem.handlers.add("preStream", (req,answer) => {
    console.log("preStream")
}).toHandle("requestDataStream");
muneem.handlers.add("parallel", (req,answer) => {
    console.log("parallel")
},{
    inParallel : true
}).toHandle("request");
muneem.handlers.add("main", (req,answer) => {
    //answer.data = '{ "hello" : "world" }';
    //answer.write('{ "hello" : "world" }');
    answer.justForFun("test");
    answer.justForFun("test");
    console.log("main")
});
muneem.handlers.add("post", (req,answer) => {
    console.log("post")
}).toHandle("response");
const server = muneem.createServer();

server.start();
