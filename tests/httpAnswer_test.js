const httpMocks = require('node-mocks-http');
const MockRes = require('mock-res');
const fs = require('fs');
const path = require('path');
const eventEmitter = require('events').EventEmitter;
const Muneem = require("../src/muneem")
const HttpAnswer = require("../src/HttpAnswer")
const ApplicationSetupError = require("../src/ApplicationSetupError")

describe ('HttpAnswer', () => {

    it('should set Content-Type', () => {
        const response = new MockRes();
        const answer = new HttpAnswer(response);

        //when
        answer.type("application/json");

        //then
        expect(response.getHeader("content-type")).toEqual("application/json");
    });

    it('should set Content-Length', () => {
        const response = new MockRes();
        const answer = new HttpAnswer(response);

        //when
        answer.length(35);

        //then
        expect(response.getHeader("content-length")).toEqual(35);
    });

    it('should return true when already answered', () => {
        const response = new MockRes();
        const answer = new HttpAnswer(response);

        //when
        response.end();

        //then
        expect(answer.answered()).toEqual(true);
    });

    it('should set status code and message', () => {
        const response = new MockRes();
        const answer = new HttpAnswer(response);

        //when
        answer.status(200,"I'm fine");

        //then
        expect(response.statusCode).toEqual(200);
        expect(response.statusMessage).toEqual("I'm fine");
    });

    it('should set,get,remove headers', () => {
        const response = new MockRes();
        const answer = new HttpAnswer(response);

        expect(answer.getHeader("name")).toEqual(undefined);

        answer.setHeader("name", "muneem")
        expect(answer.getHeader("name")).toEqual("muneem");

        answer.removeHeader("name")
        expect(answer.getHeader("name")).toEqual(undefined);
    });

    it('should set string data with content type and length', () => {
        const response = new MockRes();
        const answer = new HttpAnswer(response);

        //when
        answer.write("I'm fine.", "plain/text", 9);
        answer.end();

        //then
        expect(response._getString()).toEqual("I'm fine.");
        expect(response.getHeader("content-type")).toEqual("plain/text");
        expect(response.getHeader("content-length")).toEqual(9);
    });

    it('should set number and content length', () => {
        const response = new MockRes();
        const answer = new HttpAnswer(response);

        //when
        answer.write(420);
        answer.end();

        //then
        expect(response._getString()).toEqual("420");
        expect(response.getHeader("content-type")).toEqual(undefined);
        expect(response.getHeader("content-length")).toEqual(3);
    });

    it('should set object and it\'s length', () => {
        const response = new MockRes();
        const answer = new HttpAnswer(response);

        //when
        answer.write({ hello : 'world'});
        answer.end();

        //then
        expect(response._getString()).toEqual('{"hello":"world"}');
        //expect(response.getHeader("content-type")).toEqual("application/json");
        expect(response.getHeader("content-length")).toEqual(17);
    });

    it('should set wrong length if given', () => {
        const response = new MockRes();
        const answer = new HttpAnswer(response);

        //when
        answer.write({ hello : 'world'}, "application/json",10);
        answer.end();

        //then
        expect(response._getString()).toEqual('{"hello":"world"}');
        expect(response.getHeader("content-type")).toEqual("application/json");
        expect(response.getHeader("content-length")).toEqual(10);
    });

    it('should set stream without content length', (done) => {
        const response = new MockRes();
        const answer = new HttpAnswer(response);

        //create a file for test
        let fileWritableStream = fs.createWriteStream(path.resolve(__dirname, "fileToDownload"));
        fileWritableStream.write("This file is ready for download");
        fileWritableStream.end();

        //create a stream
        const filePath = path.resolve(__dirname, "fileToDownload");
        let fileReadableStream = fs.createReadStream(filePath);
       
        //when
        answer.write(fileReadableStream);
        answer.end();

        //then
        response.on('finish', function() {
            expect(response.getHeader("content-type")).toEqual(undefined);
            expect(response.getHeader("content-length")).toEqual(undefined);
            expect(response._responseData.toString()).toEqual("This file is ready for download");
            done();
        });
    });

    it('should set stream with content length when given', (done) => {
        const response = new MockRes();
        const answer = new HttpAnswer(response);

        //create a file for test
        let fileWritableStream = fs.createWriteStream(path.resolve(__dirname, "fileToDownload"));
        fileWritableStream.write("This file is ready for download");
        fileWritableStream.end();

        //create a stream
        const filePath = path.resolve(__dirname, "fileToDownload");
        let fileReadableStream = fs.createReadStream(filePath);
       
        //when
        answer.write(fileReadableStream,"plain/text",2);
        answer.end();

        //then
        response.on('finish', function() {
            expect(response.getHeader("content-type")).toEqual("plain/text");
            expect(response.getHeader("content-length")).toEqual(2);
            expect(response._getString()).toEqual("This file is ready for download");
            done();
        });
    });

    it('should pipe multiple streams', (done) => {
        const response = new MockRes();
        const answer = new HttpAnswer(response);

        //create a file for test
        let fileWritableStream = fs.createWriteStream(path.resolve(__dirname, "fileToDownload"));
        fileWritableStream.write("This file is ready for download");
        fileWritableStream.end();

        //create a stream
        const filePath = path.resolve(__dirname, "fileToDownload");
        let fileReadableStream = fs.createReadStream(filePath);
       
        //when
        answer.write(fileReadableStream,"plain/text");
        const zlib = require('zlib');
        answer.writeMore(zlib.createGzip());
        answer.end();

        //then
        response.on('finish', function() {
            expect(response.getHeader("content-type")).toEqual("plain/text");
            //expect(response._responseData).toEqual("This file is ready for download");
            expect(response._getString()).toEqual("This file is ready for download");
            done();
        });
    });

    it('should set and add data', () => {
        const response = new MockRes();
        const answer = new HttpAnswer(response);

        //when
        answer.write("I'm fine.");
        answer.writeMore(" How are you?");
        answer.end();

        //then
        expect(response._getString()).toEqual("I'm fine. How are you?");
    });

    it('should set but not add data when different type', () => {
        const response = new MockRes();
        const answer = new HttpAnswer(response);

        let fileWritableStream = fs.createWriteStream(path.resolve(__dirname, "fileToDownload"));
        fileWritableStream.end();

        //when
        answer.write("I'm fine.");
        expect(() => {
            answer.writeMore(fileWritableStream);
        }).toThrowError("Unsupported type object.");
    });

    it('should not set data when already set', () => {
        const response = new MockRes();
        const answer = new HttpAnswer(response);

        //when
        answer.write("I'm fine.");
        answer.write(" How are you?");
        answer.end();

        //then
        expect(response._getString()).toEqual("I'm fine.");
    });

    it('should replace data', () => {
        const response = new MockRes();
        const answer = new HttpAnswer(response);

        //when
        answer.write("I'm fine.","plain/text",9);
        answer.replace(" How are you?","application/text",10);
        answer.end();

        //then
        expect(response._getString()).toEqual(" How are you?");
        expect(response._headers).toEqual({
            "content-length" : 10,
            "content-type" : "application/text"
        });
    });

    it('should add data even if it is not set before', () => {
        const response = new MockRes();
        const answer = new HttpAnswer(response);

        //when
        answer.writeMore("I'm fine.");
        answer.end();

        //then
        expect(response._getString()).toEqual("I'm fine.");
    });

    it('should replace data even if it is not set before', () => {
        const response = new MockRes();
        const answer = new HttpAnswer(response);

        //when
        answer.replace("I'm fine.");
        answer.end();

        //then
        expect(response._getString()).toEqual("I'm fine.");
    });

    it('should ignore previously set data with data passed to end method', () => {
        const response = new MockRes();
        const answer = new HttpAnswer(response);

        //when
        answer.write("I'm fine." , "plain/text", 9);
        answer.end("replaced",  "application/text", 10,"no reason" );

        //then
        expect(response._getString()).toEqual("replaced");
        expect(response._headers).toEqual({
            "content-length" : 10,
            "content-type" : "application/text",
        });
        expect(answer.answeredReason).toEqual("no reason");
    });

    it('should error when invalid data is set', () => {
        const response = new MockRes();
        const answer = new HttpAnswer(response);

        //when
        answer.write(() => {});

        //then
        expect(() => {
            answer.end();
        }).toThrowError("Unsupported data type to send : function");
    });

    it('should error when invalid data is to add', () => {
        const response = new MockRes();
        const answer = new HttpAnswer(response);

        //when
        answer.write("I'm fine.");
        
        //then
        expect(() => {
            answer.writeMore(() => {});
        }).toThrowError("Unsupported type function.");
    });


    it('should Error when invalid data type (function) is written to send', (done) => {
        
        const muneem = Muneem();
        muneem.addHandler("main", (asked,answer) => {
            answer.write(() => {});//invalid
        } ) ;

        const routesManager = muneem.routesManager;
        
        routesManager.addRoute({
            uri: "/test",
            to: "main",
        });

        var request  = httpMocks.createRequest({
            url: '/test'
        });

        var response = httpMocks.createResponse({
            eventEmitter: require('events').EventEmitter
        });

        response.on('end', function() {
            expect(response.statusCode ).toEqual(500);
            expect(response._isEndCalled()).toBe(true);
            done();
        });
        routesManager.router.lookup(request,response);

        request.send("data sent in request");

    });

    it('should set location header and 302 status code on redirect ', (done) => {
        
        const muneem = Muneem();
        muneem.addHandler("main", (asked,answer) => {
            answer.redirectTo("http:/google.com");
        } ) ;

        const routesManager = muneem.routesManager;
        
        routesManager.addRoute({
            uri: "/test",
            to: "main",
        });

        var request  = httpMocks.createRequest({
            url: '/test'
        });

        var response = httpMocks.createResponse({
            eventEmitter: require('events').EventEmitter
        });

        response.on('end', function() {
            expect(response.statusCode ).toEqual(302);
            expect(response.getHeader("location")).toEqual("http:/google.com");
            expect(response._isEndCalled()).toBe(true);
            done();
        });
        routesManager.router.lookup(request,response);

        request.send("data sent in request");

    });
});