const MockReq = require('mock-req');
const MockRes = require('mock-res');
const Muneem = require("../src/muneem")
const winston = require('winston');
const pino = require('pino')({
    level : 'debug'
});
const path = require('path');

describe ('Muneem', () => {

    it('should error when valid logger instance is not given', () => {
        expect(()=> {
            Muneem.setLogger(require('pino')); 
        }).toThrowError("Given logger doesn't support all standard logging methods.");
    });

    //it('should log as per set logger', (done) => {
        
        /* const logger = winston.createLogger({
            level: 'debug',
            //format: winston.format.json(),
            transports: [
              new winston.transports.File({ filename: path.join(__dirname, '/logs/error.log'), level: 'error' }),
              new winston.transports.File({ filename: path.join(__dirname, '/logs/combined.log') })
            ]
        });

        Muneem.setLogger(logger); */
       /*  Muneem.setLogger(pino); 

        const muneem = Muneem();
        Muneem.addToAnswer("justForTest", function(msg){
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
            expect(response._getString() ).toEqual("justforTest : main");
            expect(response.statusCode ).toEqual(200);
            done();
        });
        routesManager.router.lookup(request,response);
    }); */

});