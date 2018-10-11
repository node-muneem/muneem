const MockReq = require('mock-req');
const MockRes = require('mock-res');
const Muneem = require("../src/muneem")
const path = require('path');

describe ('Muneem routing', () => {

    it('should registr a router using HTTP methods', (done) => {

        const app = Muneem();
        
        app.get("/test", (asked,answer) => {
            answer.write("from main");
        });

        var request  = new MockReq({
            url: '/test'
        });

        var response = new MockRes();

        response.on('finish', function() {
            expect(response._getString() ).toEqual("from main");
            expect(response.statusCode ).toEqual(200);
            done();
        });

        app.routesManager.router.lookup(request,response);
    });
});