const path = require("path");
//var uniqid = require('uniqid');


const Muneem = require("../../src/muneem");
//Muneem.setLogger(console);
//Muneem.logger.log.info("test internal logger")

Muneem.addToAnswer("justForFun", function(msg){
    this.write("justforfun : " + msg);
} );

const muneem = Muneem({
    //mappings : path.join(__dirname, "mappings.yaml"),
    //alwaysReadRequestPayload : true,
    //idGenerator : uniqid
});



/* muneem.addHandler("stream", {
    handle : () => {}
});
 */
/* muneem.addHandler("parallel", (req,answer) => {
    setTimeout(() => {
        cconsole.log("async")
    },0)
}); */
muneem.addHandler("main", (req,answer) => {
    answer.write('{ "hello" : "world" }');
    //answer.write(req.body);
    answer.justForFun("test");
    //answer.justForFun("test");
});
/* muneem.addHandler("post", (req,answer) => {
    //console.log("post")
}); */
muneem.route({
    uri: "/sample",
    to: "main"
})

/* muneem.beforeEachHandler(() => {
    //console.log("before")
}); */

muneem.start();
//console.log(muneem.routesManager.router.routes);
