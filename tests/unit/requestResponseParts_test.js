
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

    it('should set path params', (done) => {
        
        const muneem = Muneem();
        muneem.addHandler("main", (asked,answer) => {
            answer.write(asked.params.param);
        } ) ;

        const routesManager = muneem.routesManager;
        
        routesManager.addRoute({
            uri: "/test/:param",
            to: "main"
        });

        var request  = httpMocks.createRequest({
            url: '/test/val'
        });

        var response = httpMocks.createResponse({
            eventEmitter: require('events').EventEmitter
        });

        response.on('end', function() {
            expect(response._getData() ).toEqual('val');
            expect(response.statusCode ).toEqual(200);
            expect(response._isEndCalled()).toBe(true);
            done();
        });
        routesManager.router.lookup(request,response);

        request.send("data sent in request");

    });

    it('should get/set headers', (done) => {
        
        const muneem = Muneem();
        muneem.addHandler("main", (asked,answer) => {
            answer.setHeader("header1",asked.headers["header1"]);
        } ) ;

        const routesManager = muneem.routesManager;
        
        routesManager.addRoute({
            uri: "/test/:param",
            to: "main"
        });

        var request  = httpMocks.createRequest({
            url: '/test/val',
            headers: {
                "header1" : "val1",
                "header2" : "val2"
            }
        });

        var response = httpMocks.createResponse({
            eventEmitter: require('events').EventEmitter
        });

        response.on('end', function() {
            expect(response._headers["header1"]).toEqual('val1');
            expect(response.statusCode ).toEqual(200);
            expect(response._isEndCalled()).toBe(true);
            done();
        });
        routesManager.router.lookup(request,response);

        request.send("data sent in request");

    });

    it('should get/set headers which should be available to next handler', (done) => {
        
        const muneem = Muneem();
        muneem.addHandler("main", (asked,answer) => {
            answer.type("plain/text");
            answer.setHeader("removable","plain/text");
        } ) ;
        muneem.addHandler("parser", (asked,answer) => {
            var type = answer.getHeader("content-type");
            if(type === "application/json"){
                answer.write("{'hello':'world'");
            }else{
                answer.write("hello world");
            }
            answer.removeHeader("removable");
        } ) ;

        const routesManager = muneem.routesManager;
        
        routesManager.addRoute({
            uri: "/test/:param",
            to: "main",
            then: "parser"
        });

        var request  = httpMocks.createRequest({
            url: '/test/val'
        });

        var response = httpMocks.createResponse({
            eventEmitter: require('events').EventEmitter
        });

        response.on('end', function() {
            expect(response._getData()).toEqual('hello world');
            expect(response._headers).toEqual({
                "content-type": 'plain/text',
                "content-length": '11'
            });
            expect(response.statusCode ).toEqual(200);
            expect(response._isEndCalled()).toBe(true);
            done();
        });
        routesManager.router.lookup(request,response);

        request.send("data sent in request");

    });

});