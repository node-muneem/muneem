const httpMocks = require('node-mocks-http');
const eventEmitter = require('events').EventEmitter;
const Muneem = require("../../src/muneem")

describe ('Muneem', () => {

    it('should add method to HttpAnswer', (done) => {
        
        const muneem = Muneem();
        Muneem.addToAnswer("justForTest", function(msg){
            this.write("justforTest : " + msg);
        } );
        muneem.addHandler("main", (asked,answer) => {
            answer.justForTest("main");
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
            expect(response._getData() ).toEqual("justforTest : main");
            expect(response.statusCode ).toEqual(200);
            expect(response._isEndCalled()).toBe(true);
            done();
        });
        routesManager.router.lookup(request,response);

        request.send("data sent in request");

    });

});