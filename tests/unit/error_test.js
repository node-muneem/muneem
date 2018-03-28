

const RoutesManager = require("../../src/routesManager");
const httpMocks = require('node-mocks-http');
const eventEmitter = require('events').EventEmitter;
const Muneem = require("../../src/muneem")
const ApplicationSetupError = require("../../src/ApplicationSetupError")

describe ('Routes Manager', () => {

    it('should handle unepected error by any handler', (done) => {
        
        const muneem = Muneem();
        muneem.addHandler("main", (asked,answer) => {
            throw Error("युं ही।");
            answer.write(asked.query);
        } ) ;

        const routesManager = muneem.routesManager;
        
        routesManager.addRoute({
            uri: "/test",
            to: "main"
        });

        var request  = httpMocks.createRequest({
            url: '/test'
        });

        var response = httpMocks.createResponse({
            eventEmitter: require('events').EventEmitter
        });

        response.on('end', function() {
            expect(response.statusCode ).toEqual(500);
            expect(response._isEndCalled()).toBe(true);
            done();
        });
        routesManager.router.lookup(request,response);

        request.send("data sent in request");

    });
    
    it('application should set error message and stack trace', () => {
        try{
            throw new ApplicationSetupError("नहीं हो पायगा ।")
        }catch(e){
            expect(e.message).toEqual("नहीं हो पायगा ।");
            expect(e.stack).not.toBe("");
        }
    });


});