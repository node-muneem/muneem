const path = require('path');
const fs = require('fs');
const MockReq = require('mock-req');
const MockRes = require('mock-res');
const Muneem = require("../src/muneem")

describe ('Muneem directory loader', () => {

    it('should add valid handlers, compressors, and serializers including nexted path', (done) => {
        
        //Muneem.setLogger(console)
        const muneem = Muneem({
            compress : {
                threshold : 0
            },
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

        var compressionRequest  = new MockReq({
            url: '/test',
            headers : {
                "accept-encoding" : "other"
            }
        });

        var serilizationRequest  = new MockReq({
            url: '/test',
            headers : {
                "accept" : "application/other"
            }
        });

        var response1 = new MockRes();

        response1.on('finish', function() {
            expect(response1._getString() ).toEqual("from main");
            expect(response1.statusCode ).toEqual(200);
        });
        routesManager.router.lookup(request,response1);

        var response2 = new MockRes();

        response2.on('finish', function() {
            expect(response2._getString() ).toEqual("I'm fake compressor");
            expect(response2.statusCode ).toEqual(200);
        });
        routesManager.router.lookup(compressionRequest,response2);

        var response3 = new MockRes();

        response3.on('finish', function() {
            expect(response3._getString() ).toEqual("I'm fake serializer");
            expect(response3.statusCode ).toEqual(200);
            done();
        });
        routesManager.router.lookup(serilizationRequest,response3);
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

    it('should error when a serializer don\'t have type field', () => {
        
        const muneem = Muneem();
        
        expect(() => {
            muneem._addHandlers(path.join(__dirname, "app/invalidhandlers/serializers"));
        }).toThrowError("A serializer should have property 'type'.");

    });

    it('should error when a compressor don\'t have type field', () => {
        
        const muneem = Muneem();
        
        expect(() => {
            muneem._addHandlers(path.join(__dirname, "app/invalidhandlers/compressors"));
        }).toThrowError("A compressor should have property 'type'.");

    });

    it('should error when invalid handler', () => {
        
        const muneem = Muneem();
        
        expect(() => {
            muneem._addHandlers(path.join(__dirname, "app/invalidhandlers/invalid"));
        }).toThrowError("Invalid handler invalid");

    });
    

});