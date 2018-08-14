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
        var expctedLogs = `info : Adding after event defaultRoute
info : Adding after event fatBody
info : Adding after event error
info : Adding event before serverClose
info : Adding a method justForTest to HttpAnswer
debug : Request Id:undefined {"when":"GET","uri":"/test","to":"main","maxLength":1000000}
debug : Request Id:undefined Executing handler main
debug : Request Id:undefined has been answered
`;
        var logger = new mylogger();
        Muneem.setLogger(logger); 

        const muneem = Muneem();
        muneem.addToAnswer("justForTest", function(msg){
            this.write("justforTest : " + msg);
        } );
        muneem.addHandler("main", (asked,answer) => {
            answer.justForTest("main");
        } ) ;

        const routesManager = muneem.routesManager;
        
        muneem.route({
            uri: "/test",
            to: "main"
        });

        var request  = new MockReq({
            url: '/test'
        });

        var response = new MockRes();

        response.on('finish', function() {
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