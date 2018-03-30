//TODO: override default handlers
const RoutesManager = require("../../src/routesManager");
const path = require("path");
const httpMocks = require('node-mocks-http');
const eventEmitter = require('events').EventEmitter;
const Muneem = require("../../src/muneem")

describe ('Routes Manager', () => {

    it('should call default Handler when route is not registered', (done) => {
        
        const muneem = Muneem();

        muneem.addHandler("main", (asked,answer) => {
            // do nothing
        } ) ;

        const routesManager = muneem.routesManager;
        
        routesManager.addRoute({
            uri: "/test2",
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
            expect(response.statusMessage ).toEqual("There is something wrong. Please check the request URL and method again. So I can respond properly.");
            expect(response._isEndCalled()).toBe(true);
            done();
        });
        routesManager.router.lookup(request,response);

        request.send("data sent in request");

    });

    it('should call custom default Handler when route is not registered', (done) => {
        
        const muneem = Muneem();

        muneem.addHandler("main", (asked,answer) => {
            // do nothing
        } ) ;

        muneem.addHandler("__defaultRoute", (asked,answer) => {
            answer.status(404, "Bad time");
            answer.end(null,"no router was found");
        } ) ;

        const routesManager = muneem.routesManager;
        
        routesManager.addRoute({
            uri: "/test2",
            to: "main"
        });

        var request  = httpMocks.createRequest({
            url: '/test'
        });

        var response = httpMocks.createResponse({
            eventEmitter: require('events').EventEmitter
        });

        response.on('end', function() {
            expect(response.statusCode ).toEqual(404);
            expect(response.statusMessage ).toEqual("Bad time");
            expect(response._isEndCalled()).toBe(true);
            done();
        });
        routesManager.router.lookup(request,response);

        request.send("data sent in request");

    });
 
    it('should call __exceedContentLengthHandler when content length is bigger than expected', (done) => {
        
        const muneem = Muneem();

        muneem.addHandler("main", (asked,answer) => {
            answer.write("I'm happy to response back");
        } ) ;

        const routesManager = muneem.routesManager;
        
        routesManager.addRoute({
            uri: "/test",
            when: "POST",
            to: "main",
            maxLength: 30
        });

        var request  = httpMocks.createRequest({
            url: '/test',
            method: "POST"
        });

        var response = httpMocks.createResponse({
            eventEmitter: require('events').EventEmitter
        });

        response.on('end', function() {
            //expect(response._getData()).toEqual("");
            expect(response.statusCode ).toEqual(413);
            expect(response.statusMessage ).toEqual("request entity too large");
            expect(response._isEndCalled()).toBe(true);
            done();
        });
        routesManager.router.lookup(request,response);

        request.send("Let's send some big request that the server denies.");

    });

    it('should call __exceedContentLengthHandler when wrong content length is given but bigger than expected', (done) => {
        
        const muneem = Muneem();

        muneem.addHandler("main", (asked,answer) => {
            answer.write("I'm happy to response back");
        } ) ;

        const routesManager = muneem.routesManager;
        
        routesManager.addRoute({
            uri: "/test",
            when: "POST",
            to: "main",
            maxLength: 30
        });

        var request  = httpMocks.createRequest({
            url: '/test',
            method: "POST",
            headers : {
                "content-length" : 29
            }
        });

        var response = httpMocks.createResponse({
            eventEmitter: require('events').EventEmitter
        });

        response.on('end', function() {
            expect(response._getData()).toEqual("");
            expect(response.statusCode ).toEqual(413);
            expect(response.statusMessage ).toEqual("request entity too large");
            expect(response._isEndCalled()).toBe(true);
            done();
        });
        routesManager.router.lookup(request,response);

        request.send("Let's send some big request that the server denies.");

    });

    it('should call __exceedContentLengthHandler when content length is given and bigger than expected', (done) => {
        
        const muneem = Muneem();

        muneem.addHandler("main", (asked,answer) => {
            answer.write("I'm happy to response back");
        } ) ;

        const routesManager = muneem.routesManager;
        
        routesManager.addRoute({
            uri: "/test",
            when: "POST",
            to: "main",
            maxLength: 30
        });

        var request  = httpMocks.createRequest({
            url: '/test',
            method: "POST",
            headers : {
                "content-length" : 70
            }
        });

        var response = httpMocks.createResponse({
            eventEmitter: require('events').EventEmitter
        });

        response.on('end', function() {
            expect(response._getData()).toEqual("");
            expect(response.statusCode ).toEqual(413);
            expect(response.statusMessage ).toEqual("request entity too large");
            expect(response._isEndCalled()).toBe(true);
            done();
        });
        routesManager.router.lookup(request,response);

        request.send("Let's send small");

    }); 

});