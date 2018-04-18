const RoutesManager = require("../src/routesManager");
const MockReq = require('mock-req');
const MockRes = require('mock-res');
const Muneem = require("../src/muneem")
const ApplicationSetupError = require("../src/ApplicationSetupError")

describe ('Routes Manager', () => {

    it('should handle unepected error by any handler', (done) => {
        
        const muneem = Muneem();
        muneem.addHandler("main", (asked,answer) => {
            throw Error("युं ही।");
        } ) ;

        const routesManager = muneem.routesManager;
        
        routesManager.addRoute({
            uri: "/test",
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
    
    it('application should set error message and stack trace', () => {
        try{
            throw new ApplicationSetupError("नहीं हो पायगा ।")
        }catch(e){
            expect(e.message).toEqual("नहीं हो पायगा ।");
            expect(e.stack).not.toBe("");
        }
    });


});