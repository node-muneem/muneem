const MockReq = require('mock-req');
const MockRes = require('mock-res');
const Muneem = require("../src/muneem")

describe ('Muneem', () => {

    it('should add method to HttpAnswer', (done) => {
        
        const muneem = Muneem();
        Muneem.addToAnswer("justForTest", function(msg){
            this.write("justforTest : " + msg);
        } );
        muneem.addHandler("main", (asked,answer) => {
            answer.justForTest("main");
        } ) ;

        const routesManager = muneem.routesManager;
        
        muneem.route({
            uri: "/test",
            to: "main"
        });

        var request  = new MockReq({
            url: '/test'
        });

        var response = new MockRes();

        response.on('finish', function() {
            expect(response._getString() ).toEqual("justforTest : main");
            expect(response.statusCode ).toEqual(200);
            done();
        });
        routesManager.router.lookup(request,response);
    });

});