//TODO: override default handlers
const RoutesManager = require("../src/routesManager");
const path = require("path");
const MockReq = require('mock-req');
const MockRes = require('mock-res');
const Muneem = require("../src/muneem")

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

        var request  = new MockReq({
            url: '/test'
        });

        var response = new MockRes();

        response.on('finish', function() {
            expect(response.statusCode ).toEqual(500);
            //expect(response.statusMessage ).toEqual("There is something wrong. Please check the request URL and method again. So I can respond properly.");
            done();
        });
        routesManager.router.lookup(request,response);

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

        var request  = new MockReq({
            url: '/test'
        });

        var response = new MockRes();

        response.on('finish', function() {
            expect(response.statusCode ).toEqual(404);
            //expect(response.statusMessage ).toEqual("Bad time");
            done();
        });
        routesManager.router.lookup(request,response);

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

        var request  = new MockReq({
            url: '/test',
            method: "POST"
        });

        var response = new MockRes();

        response.on('finish', function() {
            //expect(response._getString()).toEqual("");
            expect(response.statusCode ).toEqual(413);
            //expect(response.statusMessage ).toEqual("request entity too large");
            done();
        });
        routesManager.router.lookup(request,response);

        request.write("Let's send some big request that the server denies.");
        request.end();
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

        var request  = new MockReq({
            url: '/test',
            method: "POST",
            headers : {
                "content-length" : 29
            }
        });

        var response = new MockRes();

        response.on('finish', function() {
            expect(response._getString()).toEqual("");
            expect(response.statusCode ).toEqual(413);
            //expect(response.statusMessage ).toEqual("request entity too large");
            done();
        });
        routesManager.router.lookup(request,response);

        request.write("Let's send some big request that the server denies.");
        request.end();
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

        var request  = new MockReq({
            url: '/test',
            method: "POST",
            headers : {
                "content-length" : 70
            }
        });

        var response = new MockRes();

        response.on('finish', function() {
            expect(response._getString()).toEqual("");
            expect(response.statusCode ).toEqual(413);
            //expect(response.statusMessage ).toEqual("request entity too large");
            done();
        });
        routesManager.router.lookup(request,response);

        request.write("Let's send small");
        request.end();
    }); 

});