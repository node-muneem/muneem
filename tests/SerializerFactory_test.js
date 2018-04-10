//test if muneem sets correctly
//test against nimn,msgpack parsers
//test factory alone

const HttpAsked = require("../src/HttpAsked")
const MockReq = require('mock-req');
const MockRes = require('mock-res');
const SerializerFactory = require("../src/SerializerFactory")
const Muneem = require("../src/muneem")

describe ('Object Serializer', () => {

    //Ref: https://tools.ietf.org/html/rfc7231#section-5.3.2
    /* it('should return serializer function with high weightage', async () => {
        serializerFactory = new SerializerFactory();

        serializerFactory.add("text/plain", () => 35);
        serializerFactory.add("text/html", () => 38);

        const request = new MockReq({
            headers : {
                "accept" : "text/plain; q=0.3, text/html"
            }
        });

        //when
        const serializer = serializerFactory.get(request);
        
        //then
        expect(serializer()).toEqual(38);
    });

    it('should return registered serializer function', async () => {
        serializerFactory = new SerializerFactory();

        serializerFactory.add("text/plain", () => 35);
        //serializerFactory.add("text/html", () => 38);

        const request = new MockReq({
            headers : {
                "accept" : "text/plain; q=0.3, text/html"
            }
        });

        //when
        const serializer = serializerFactory.get(request);
        
        //then
        expect(serializer()).toEqual(35);
    });

    it('should return serialize function of serializer class with high weightage', async () => {
        serializerFactory = new SerializerFactory();

        serializerFactory.add("text/plain", () => 35);
        serializerFactory.add("text/html", {
            serialize : () => 38
        });

        const request = new MockReq({
            headers : {
                "accept" : "text/plain; q=0.3, text/html"
            }
        });

        //when
        const serializer = serializerFactory.get(request);
        
        //then
        expect(serializer()).toEqual(38);
    });

    it('should return serialize function of new instance of serializer class with high weightage', async () => {
        serializerFactory = new SerializerFactory();

        const Serializer = function(){};
            Serializer.prototype.serialize = () => 38;
        ;


        serializerFactory.add("text/plain", () => 35);
        serializerFactory.add("text/html", new Serializer());

        const request = new MockReq({
            headers : {
                "accept" : "text/plain; q=0.3, text/html"
            }
        });

        //when
        const serializer = serializerFactory.get(request);
        
        //then
        expect(serializer()).toEqual(38);
    }); */

    it('Muneem should set serializer ', (done) => {
        
        const muneem = Muneem({
            compress : false
        });
        muneem.addHandler("main", (asked,answer) => {
            answer.write( { "key" : "value"});
        } ) ;
        muneem.addObjectSerializer("text/plain", (asked,answer) => {
            answer.replace("serialized: " + JSON.stringify(answer.data));
        });
        const routesManager = muneem.routesManager;
        
        routesManager.addRoute({
            uri: "/test",
            when: "POST",
            to: "main",
        });

        const request = new MockReq({
            url: "/test",
            method: "POST",
            headers : {
                "accept" : "text/plain; q=0.3, text/html"
            }
        });

        var response =  new MockRes();

        response.on('finish', function() {
            expect(response.statusCode ).toEqual( 200 );
            expect(response._getString() ).toEqual("serialized: {\"key\":\"value\"}");
            done();
        });
        routesManager.router.lookup(request,response);

        request.write("data sent in request");
        request.end();
    });

});