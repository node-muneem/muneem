const RoutesManager = require("../src/routesManager");
const MockReq = require('mock-req');
const MockRes = require('mock-res');
const Muneem = require("../src/muneem")
const ApplicationSetupError = require("../src/ApplicationSetupError")

describe ('Routes Manager', () => {

    it('should handle unexpected error from a handler', (done) => {
        
        const muneem = Muneem();
        muneem.addHandler("main", (asked,answer) => {
            throw Error("some error");
        } ) ;

        muneem.on( "error", (err, asked) => {
            expect(err.message).toEqual("some error")
        } ) ;

        const routesManager = muneem.routesManager;
        
        routesManager.addRoute({
            url: "/test",
            to: "main"
        });

        var request  = new MockReq({
            url: '/test'
        });

        var response = new MockRes();

        response.on('finish', function() {
            expect(response.statusCode ).toEqual(500);
            done();
        });
        
        routesManager.router.lookup(request,response);

    });

    it('should handle unexpected error using custom handler', (done) => {
        
        const muneem = Muneem();
        muneem.addHandler("main", (asked,answer) => {
            throw Error("some error");
        } ) ;

        muneem.on( "error", (err, asked) => {
            expect(err.message).toEqual("some error")
        } ) ;

        muneem.setErrorHandler( (err, asked, answer) => {
            expect(err.message).toEqual("some error")
            answer.write("Internal server error");
            answer.end(200);
        } ) ;

        const routesManager = muneem.routesManager;
        
        routesManager.addRoute({
            url: "/test",
            to: "main"
        });

        var request  = new MockReq({
            url: '/test'
        });

        var response = new MockRes();

        response.on('finish', function() {
            expect(response.statusCode ).toEqual(200);
            expect(response._getString() ).toEqual("Internal server error");
            done();
        });
        
        routesManager.router.lookup(request,response);

    });
    
    it('application should set error message and stack trace', () => {
        /* try{
            throw new ApplicationSetupError("some error")
        }catch(e){
            expect(e.message).toEqual("some error");
            expect(e.stack).not.toBe("");
        } */
    });


});