const path = require("path");

const muneem = require("../../src/muneem")({
    mappings : path.join(__dirname, "mappings.yaml")
});

muneem.handlers.add("preStream", (req,answer) => {
    //console.log("preStream")
}).toHandle("requestDataStream");
muneem.handlers.add("parallel", (req,answer) => {
    //console.log("parallel")
},{
    inParallel : true
}).toHandle("request");
muneem.handlers.add("main", (req,answer) => {
    answer.data = '{ "hello" : "world" }';
});
muneem.handlers.add("post", (req,answer) => {
    //console.log("post")
}).toHandle("response");
const server = muneem.createServer();

server.start();

/* muneem.contentHandler.readTemplate("")
muneem.contentHandler.location("")
muneem.contentHandler.location() */