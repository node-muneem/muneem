//cookies, query param, headers, pre closing stream



const RoutesManager = require("../../src/routesManager");
const HandlersMap = require("../../src/Container");
const Handler = require("../../src/Handler");
const path = require("path");
const httpMocks = require('node-mocks-http');
const eventEmitter = require('events').EventEmitter;
const Muneem = require("../../src/muneem")

describe ('Routes Manager', () => {

    it('should set query params', (done) => {
        
        const muneem = Muneem();

        muneem.addHandler("main", (asked,answer) => {
            answer.write(asked.query);
        } ) ;

        const routesManager = muneem.routesManager;
        
        routesManager.addRoute({
            uri: "/test",
            to: "main"
        });

        var request  = httpMocks.createRequest({
            url: '/test?query=param&nd=val'
        });

        var response = httpMocks.createResponse({
            eventEmitter: require('events').EventEmitter
        });

        response.on('end', function() {
            expect(response._getData() ).toEqual('{"query":"param","nd":"val"}');
            expect(response.statusCode ).toEqual(200);
            expect(response._isEndCalled()).toBe(true);
            done();
        });
        routesManager.router.lookup(request,response);

        request.send("data sent in request");

    });

});