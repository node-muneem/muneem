const RoutesManager = require("../src/routesManager");
const httpMocks = require('node-mocks-http');
const eventEmitter = require('events').EventEmitter;
const Muneem = require("../src/muneem")
const ApplicationSetupError = require("../src/ApplicationSetupError")

describe ('Routes Manager', () => {

    //TODO: test it properly
    it('should handle unepected error by any handler', (done) => {
        
        const muneem = Muneem();
        muneem.addHandler("main", (asked,answer) => {
            answer.write("This is a string");
        } ) ;
        muneem.addHandler("toStream", (asked,answer) => {
            var Readable = require('stream').Readable;
            var s = new Readable();
            s._read = function noop() {};
            answer.replace(s);
            s.push(answer.data);
        } ) ;

        const routesManager = muneem.routesManager;
        
        routesManager.addRoute({
            uri: "/test",
            to: "main",
            then: "toStream"
        });

        var request  = httpMocks.createRequest({
            url: '/test'
        });

        var response = httpMocks.createResponse({
            eventEmitter: require('events').EventEmitter
        });

        response.on('data', function(chunk) {
            console.log(chunk)
            expect(response.statusCode ).toEqual(500);
            expect(response._isEndCalled()).toBe(true);
            done();
        });
        response.on('end', function() {
            console.log(response._getData())
            expect(response.statusCode ).toEqual(500);
            expect(response._isEndCalled()).toBe(true);
            done();
        });
        routesManager.router.lookup(request,response);

        request.send("data sent in request");

    });

    it('should Error when handle unepected error by any handler', (done) => {
        
        const muneem = Muneem();
        muneem.addHandler("main", (asked,answer) => {
            answer.write(() => {});
        } ) ;

        const routesManager = muneem.routesManager;
        
        routesManager.addRoute({
            uri: "/test",
            to: "main",
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

    it('should set location header and 302 status code on redirect ', (done) => {
        
        const muneem = Muneem();
        muneem.addHandler("main", (asked,answer) => {
            answer.redirectTo("http:/google.com");
        } ) ;

        const routesManager = muneem.routesManager;
        
        routesManager.addRoute({
            uri: "/test",
            to: "main",
        });

        var request  = httpMocks.createRequest({
            url: '/test'
        });

        var response = httpMocks.createResponse({
            eventEmitter: require('events').EventEmitter
        });

        response.on('end', function() {
            expect(response.statusCode ).toEqual(302);
            expect(response.getHeader("location")).toEqual("http:/google.com");
            expect(response._isEndCalled()).toBe(true);
            done();
        });
        routesManager.router.lookup(request,response);

        request.send("data sent in request");

    });
});