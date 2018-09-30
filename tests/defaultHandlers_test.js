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
            expect(response.statusCode ).toEqual(404);
            done();
        });
        routesManager.router.lookup(request,response);

    });

    it('should call custom default Handler when route is not registered', (done) => {
        
        const muneem = Muneem();

        muneem.setRouteNotFoundHandler( (asked, answer) => {
            expect(asked._native.url).toEqual("/test");
            answer.status(500);
            answer.end(null,"no router was found");
        })

        muneem.on("routeNotFound", asked => {
            expect(asked._native.url).toEqual("/test");
        });
        
        muneem.route({
            uri: "/test2",
            to: async (asked) => {
                await asked.readBody();
            }
        });

        var request  = new MockReq({
            url: '/test'
        });

        var response = new MockRes();

        response.on('finish', function() {
            expect(response.statusCode ).toEqual(500);
            done();
        });

        const routesManager = muneem.routesManager;
        routesManager.router.lookup(request,response);

    });
 
    it('should call default exceedContentLengthHandler', (done) => {
        
        const muneem = Muneem();

        muneem.addHandler("main", async (asked,answer) => {
            await asked.readBody();
            answer.write("I'm happy to response back");
        } ) ;

        const routesManager = muneem.routesManager;
        
        routesManager.addRoute({
            uri: "/test",
            when: "POST",
            to: "main",
            maxLength: 10
        });

        var request  = new MockReq({
            url: '/test',
            method: "POST"
        });

        var response = new MockRes();

        response.on('finish', function() {
            expect(response.statusCode ).toEqual(413);
            expect(response._getString()).toEqual("");
            done();
        });
        routesManager.router.lookup(request,response);
        expect( () => {
            request.write("Let's send some data");
        }).toThrowError("request entity is too large");
        request.end();
    }); 

});