const MockReq = require('mock-req');
const MockRes = require('mock-res');
const Muneem = require("../src/muneem")

describe ('Muneem store', () => {

    it('should return saved resources', (done) => {
        
        const muneem = Muneem();
        muneem.addToStore("str", "amit gupta");
        muneem.addToStore("obj", {
            get : () => "an object"
        });

        muneem.addHandler("main", (asked,answer, giveMe) => {
            expect(giveMe("str")).toEqual("amit gupta");
            expect(giveMe("obj").get() ).toEqual("an object");
            expect(giveMe("not present") ).toEqual(undefined);
            done();
        } ) ;

        const routesManager = muneem.routesManager;
        
        muneem.route({
            url: "/test",
            to: "main"
        });

        var request  = new MockReq({
            url: '/test'
        });

        var response = new MockRes();

        routesManager.router.lookup(request,response);
    });

});