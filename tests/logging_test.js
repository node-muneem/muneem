const MockReq = require('mock-req');
const MockRes = require('mock-res');
const Muneem = require("../src/muneem")
const path = require('path');

describe ('Muneem', () => {

    it('should error when valid logger instance is not given', () => {
        expect(()=> {
            Muneem.setLogger(require('pino')); 
        }).toThrowError("Given logger doesn't support all standard logging methods.");
    });

    it('should log as per set logger', (done) => {
        var expctedLogs = `info : Adding custom route not found handler.
info : Adding custom fat body handler.
info : Adding custom error handler.
info : Adding event before 'serverClose'
info : Adding after event 'route'
warn : Handler registered for 'route' event can access route configuration.
info : Adding after event 'start'
info : Adding after event 'request'
warn : Handler registered for 'request' event can access raw request.
info : Adding after event 'fatBody'
info : Adding after event 'send'
info : Adding after event 'close'
info : Adding after event 'routeNotFound'
info : Adding after event 'error'
info : Adding event before 'addRoute'
warn : Security warning: Handler registered for 'addRoute' event can know the name and sequence of handlers and the configuration for any route.
info : Adding event before 'route'
warn : Handler registered for before 'route' event can access raw request.
info : Adding event before 'start'
warn : Handler registered for 'start' event can read server related information. Like: host, port etc.
info : Adding event before 'send'
info : Adding event before 'close'
info : Adding after event 'pre'
info : Adding after event 'post'
info : Adding after event 'each'
info : Adding after event 'main'
info : Adding event before 'pre'
info : Adding event before 'post'
info : Adding event before 'each'
info : Adding event before 'main'
info : Adding a method justForTest to HttpAnswer
info : before addRoute
debug : Request Id:undefined {"when":"GET","url":"/test","to":"main","maxLength":1000000}
info : after route
debug : Request Id:undefined Executing before of main
info : before each
info : before main
debug : Request Id:undefined Executing handler main
debug : Request Id:undefined Executing after of main
info : after each
info : after main
info : before send
info : after send
debug : Request Id:undefined has been answered
`;
        var logger = new mylogger();
        Muneem.setLogger(logger); 

        const app = Muneem();
        app.on("route", () => { logger.info("after route"); })
        app.on("start", () => { logger.info("after start"); })
        app.on("request", () => { logger.info("after request"); })
        app.on("fatBody", () => { logger.info("after fatBody"); })
        app.on("send", () => { logger.info("after send"); })
        app.on("close", () => { logger.info("after close"); })
        app.on("routeNotFound", () => { logger.info("after routeNoteFound"); })
        app.on("error", () => { logger.info("after error"); })

        app.before("addRoute", () => { logger.info("before addRoute"); })
        app.before("route", () => { logger.info("before route"); })
        app.before("start", () => { logger.info("before start"); })
        app.before("send", () => { logger.info("before send"); })
        app.before("close", () => { logger.info("before close"); })
        
        app.on("pre", () => { logger.info("after pre"); })
        app.on("post", () => { logger.info("after post"); })
        app.on("each", () => { logger.info("after each"); })
        app.on("main", () => { logger.info("after main"); })
        
        app.before("pre", () => { logger.info("before pre"); })
        app.before("post", () => { logger.info("before post"); })
        app.before("each", () => { logger.info("before each"); })
        app.before("main", () => { logger.info("before main"); })
        

        app.addToAnswer("justForTest", function(msg){
            this.write("justforTest : " + msg);
        } );
        app.addHandler("main", (asked,answer) => {
            answer.justForTest("main");
        } ) ;

        const routesManager = app.routesManager;
        
        app.route({
            url: "/test",
            to: "main"
        });

        var request  = new MockReq({
            url: '/test'
        });

        var response = new MockRes();

        response.on('finish', function() {
            //console.log(logger.logs)
            expect(logger.logs ).toEqual(expctedLogs);
            expect(response._getString() ).toEqual("justforTest : main");
            expect(response.statusCode ).toEqual(200);
            done();
        });
        routesManager.router.lookup(request,response);
    });

});

class mylogger {
    constructor(level){
        this.logs = "";
        this.level = level || 3;
    }

    log(type, args){
        this.logs += type + " : ";
        for( var i in args){
            if(typeof args[i] === "object"){
                this.logs += JSON.stringify(args[i]);
            }else{
                this.logs += args[i];
            }

            if( i < args.length - 1) this.logs += " ";
        }
        this.logs += "\n";
    }

    info(){
        this.log("info",arguments);
    }

    warn(){
        this.log("warn",arguments);
    }

    error(){
        this.log("error",arguments);
    }

    debug(){
        this.log("debug",arguments);
    }
}