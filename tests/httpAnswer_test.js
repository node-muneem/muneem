const RoutesManager = require("../src/routesManager");
const httpMocks = require('node-mocks-http');
const MockRes = require('mock-res');
const eventEmitter = require('events').EventEmitter;
const Muneem = require("../src/muneem")
const HttpAnswer = require("../src/HttpAnswer")
const ApplicationSetupError = require("../src/ApplicationSetupError")

describe ('Routes Manager', () => {

    it('should set Content-Type', () => {
        const response = new MockRes();
        const answer = new HttpAnswer(response);

        //when
        answer.type("application/json");

        //then
        expect(response.getHeader("content-type")).toEqual("application/json");
    });

    it('should set Content-Length', () => {
        const response = new MockRes();
        const answer = new HttpAnswer(response);

        //when
        answer.length(35);

        //then
        expect(response.getHeader("content-length")).toEqual(35);
    });

    it('should return true when already answered', () => {
        const response = new MockRes();
        const answer = new HttpAnswer(response);

        //when
        response.end();

        //then
        expect(answer.answered()).toEqual(true);
    });

    it('should Error when invalid data type (function) is written to send', (done) => {
        
        const muneem = Muneem();
        muneem.addHandler("main", (asked,answer) => {
            answer.write(() => {});//invalid
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