const path = require('path');
const fs = require('fs');
const MockReq = require('mock-req');
const MockRes = require('mock-res');
const Muneem = require("../src/muneem")

describe ('Muneem directory loader', () => {

    it('should add valid handlers, including nested path', (done) => {
        
        //Muneem.setLogger(console)
        const muneem = Muneem({
            handlers : [
                path.join(__dirname, "app/handlers"),
                //path.join(__dirname, "app/handlers/nested")
            ]
        });
        
        //adding multiple times should not cause any issue
        //muneem._addHandlers(path.join(__dirname, "app/handlers"));

        const routesManager = muneem.routesManager;
        
        muneem.route({
            url: "/test",
            to: "main"
        });

        muneem.route({
            url: "/testNested",
            to: "nested.nested"
        });

        expect( () => {
            muneem.route({
                url: "/testNotAHandler",
                to: "not-a-handler"
            });
        }).toThrowError("Unregistered handler not-a-handler");

        var request1  = new MockReq({
            url: '/test'
        });

        var response1 = new MockRes();

        response1.on('finish', function() {
            expect(response1._getString() ).toEqual("from main");
            expect(response1.statusCode ).toEqual(200);
            done();
        });

        routesManager.router.lookup(request1, response1);

        var request2  = new MockReq({
            url: '/testNested'
        });

        var response2 = new MockRes();

        response2.on('finish', function() {
            expect(response2._getString() ).toEqual("from nested");
            expect(response2.statusCode ).toEqual(200);
            done();
        });

        routesManager.router.lookup(request2, response2);
    });

    it('should error when invalid dir path is given', () => {
        
        expect(() => {
            Muneem({
                handlers : path.join(__dirname, "app/handlers/main.js")
            });
        }).toThrow();

    });

});