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
                path.join(__dirname, "app/handlers/nested")
            ]
        });
        
        //adding multiple times should not cause any issue
        muneem._addHandlers(path.join(__dirname, "app/handlers"));

        const routesManager = muneem.routesManager;
        
        muneem.route({
            uri: "/test",
            to: "main"
        });

        var request  = new MockReq({
            url: '/test'
        });

        var response1 = new MockRes();

        response1.on('finish', function() {
            expect(response1._getString() ).toEqual("from main");
            expect(response1.statusCode ).toEqual(200);
            done();
        });
        routesManager.router.lookup(request,response1);
    });

    it('should error when invalid dir path is given', () => {
        
        expect(() => {
            Muneem({
                handlers : path.join(__dirname, "app/handlers/main.js")
            });
        }).toThrow();

    });

    it('should error when a handler don\'t have name field', () => {
        
        const muneem = Muneem();
        
        expect(() => {
            muneem._addHandlers(path.join(__dirname, "app/invalidhandlers/handlers"));
        }).toThrowError("A handler should have property 'name'.");

    });

    it('should error when invalid handler', () => {
        
        const muneem = Muneem();
        
        expect(() => {
            muneem._addHandlers(path.join(__dirname, "app/invalidhandlers/invalid"));
        }).toThrowError("Invalid handler invalid");

    });
    

});