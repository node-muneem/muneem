const path = require("path");

const muneem = require("../../src/muneem")({
    mappings : path.join(__dirname, "mappings.yaml")
});

muneem.handlers.add("preStream", (req,params,routeMapping) => {
    //console.log("preStream")
});
muneem.handlers.add("parallel", (req,params,routeMapping) => {
    //console.log("parallel")
});
muneem.handlers.add("main", (req,answer,params,routeMapping) => {
    answer.data = '{ "hello" : "world" }';
});
muneem.handlers.add("post", (req,answer,params,routeMapping) => {
    //console.log("post")
});
const server = muneem.createServer();

server.start();

/* muneem.contentHandler.readTemplate("")
muneem.contentHandler.location("")
muneem.contentHandler.location() */