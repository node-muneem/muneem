const MockRes = require('mock-res');
const MockReq = require('mock-req');
const fs = require('fs');
const eventEmitter = require('events').EventEmitter;
const path = require('path');
const HttpAnswer = require("../src/HttpAnswer")
const ApplicationSetupError = require("../src/ApplicationSetupError")

describe ('HttpAnswer', () => {

    const containers = {};

    it('should set Content-Type', () => {
        const answer = new HttpAnswer();

        //when
        answer.type("application/json");

        //then
        expect(answer.getHeader("content-type")).toEqual("application/json");
        expect( answer.type() ).toEqual("application/json");
    });

    it('should set Content-Length', () => {
        const answer = new HttpAnswer();

        //when
        answer.length(35);

        //then
        expect(answer.getHeader("content-length")).toEqual(35);
        expect( answer.length() ).toEqual(35);
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
        const answer = new HttpAnswer();

        //when
        answer.status(200,"I'm fine");

        //then
        expect(answer._statusCode).toEqual(200);
        //expect(response.statusMessage).toEqual("I'm fine");
    });

    it('should set,get,remove headers', () => {
        const answer = new HttpAnswer();

        expect(answer.getHeader("name")).toEqual(undefined);

        answer.setHeader("name", "muneem")
        expect(answer.getHeader("Name")).toEqual("muneem");

        answer.setHeader("name", "accountant")
        expect(answer.getHeader("name")).toEqual("accountant");

        answer.removeHeader("name")
        expect(answer.getHeader("name")).toEqual(undefined);
    });

    it('should set,get, cookie headers', () => {
        const answer = new HttpAnswer();

        expect(answer.getHeader("set-cookie")).toEqual(undefined);

        answer.setHeader("Set-Cookie", "choco-flavoured")
        expect(answer.getHeader("set-cookie")).toEqual("choco-flavoured");
        
        answer.setHeader("set-cookie", "vanilla-flavoured")
        expect(answer.getHeader("set-cookie")).toEqual(["choco-flavoured","vanilla-flavoured"]);
    });

    it('should set string data with content type and length', () => {
        const response = new MockRes();
        const request = buildMockedRequest();
        const answer = new HttpAnswer(response,request,containers,new eventEmitter());

        //when
        answer.write("I'm fine.", "plain/text", 9);
        answer.end();

        //then
        expect(response._getString()).toEqual("I'm fine.");
        expect(response.getHeader("content-type")).toEqual("plain/text");
        expect(response.getHeader("content-length")).toEqual(9);
    });

    it('should set stream without content length', (done) => {
        const response = new MockRes();
        const request = buildMockedRequest();
        const answer = new HttpAnswer(response,request,containers,new eventEmitter());

        //create a file for test
        let fileWritableStream = fs.createWriteStream(path.resolve(__dirname, "fileToDownload"));
        fileWritableStream.write("This file is ready for download");
        fileWritableStream.end();

        //create a stream
        const filePath = path.resolve(__dirname, "fileToDownload");
        let fileReadableStream = fs.createReadStream(filePath);
       
        //when
        answer.write(fileReadableStream);
        
        //then
        /* response.on('finish', function() {
            expect( response.getHeader("content-type")).toEqual(undefined);
            expect( response.getHeader("content-length")).toEqual(undefined);
            expect( response._responseData.toString() ).toEqual("This file is ready for download");
            done();
        }); */

        let chunks = [];   
        response.on('data', chunk => {
            chunks.push(chunk);
        });
        response.on('finish', function() {
            chunks = Buffer.concat(chunks);
            expect(response.getHeader("content-length")).toEqual(undefined);
            expect(chunks.toString() ).toEqual("This file is ready for download");
            expect(response.statusCode ).toEqual(200);
            done();
        });

        answer.end();
    });

    it('should set stream with content length when given', (done) => {
        const response = new MockRes();
        const request = buildMockedRequest();
        const answer = new HttpAnswer(response,request,null,new eventEmitter());

        //create a file for test
        fs.writeFileSync(path.resolve(__dirname, "fileToDownload"), "This file is ready for download");

        //create a stream
        let fileReadableStream = fs.createReadStream(path.resolve(__dirname, "fileToDownload"));
       
        //when
        answer.write(fileReadableStream,"plain/text",2);
        answer.end();

        //then
        response.on('finish', function() {
            expect(response.getHeader("content-type")).toEqual("plain/text");
            expect(response.getHeader("content-length")).toEqual(2);
            expect(response._getString()).toEqual("This file is ready for download");
            //expect(response._responseData).toEqual("This file is ready for download");

            done();
        });
    });

    it('should not set data when already set and safety is on', () => {
        const response = new MockRes();
        const request = buildMockedRequest();
        const answer = new HttpAnswer(response,request,containers,new eventEmitter());

        //when
        answer.write("I'm fine.");
        answer.write(" How are you?", null, null, true);
        answer.end();

        //then
        expect(response._getString()).toEqual("I'm fine.");
    });

    it('should set data when already not set and safety is on', () => {
        const response = new MockRes();
        const request = buildMockedRequest();
        const answer = new HttpAnswer(response,request,containers,new eventEmitter());

        //when
        answer.write(" How are you?", null, null, true);
        answer.end();

        //then
        expect(response._getString()).toEqual(" How are you?");
    });

    it('should replace data when safety is on', () => {
        const response = new MockRes();
        const request = buildMockedRequest();
        const answer = new HttpAnswer(response,request,containers,new eventEmitter());

        //when
        answer.write("I'm fine.","plain/text",9);
        answer.write(" How are you?","application/text",10, false);
        answer.end();

        //then
        expect(response._getString()).toEqual(" How are you?");
        expect(response._headers).toEqual({
            "content-length" : 10,
            "content-type" : "application/text"
        });
    });

    it('should not set content length for status 204', (done) => {
        const response = new MockRes();
        const request = buildMockedRequest();
        const answer = new HttpAnswer(response,request,containers,new eventEmitter());

        //when
        answer.status(204);
        answer.end();

        //then
        response.on('finish', function() {
            expect(response._headers["content-length"] ).toEqual(undefined);
            done();
        });
    });

    it('should not set content length for status < 200', (done) => {
        const response = new MockRes();
        const request = buildMockedRequest();
        const answer = new HttpAnswer(response,request,containers,new eventEmitter());

        //when
        answer.status(111);
        answer.end();

        //then
        response.on('finish', function() {
            expect(response._headers["content-length"] ).toEqual(undefined);
            done();
        });
    });

    it('should not set content length for status 2xx and method CONNECT', (done) => {
        const response = new MockRes();
        const request = buildMockedRequest(null,"CONNECT");
        const answer = new HttpAnswer(response,request,containers,new eventEmitter());

        //when
        answer.status(200);
        answer.end();

        //then
        response.on('finish', function() {
            expect(response._headers["content-length"] ).toEqual(undefined);
            done();
        });
    });

    it('should set location header and 302 status code on redirect ', () => {
        
        const response = new MockRes();
        const request = buildMockedRequest();
        const answer = new HttpAnswer(response,request,containers,new eventEmitter());

        //when
        answer.redirectTo("http:/google.com");

        //then
        expect(response.statusCode ).toEqual(302);
        expect(response.getHeader("location")).toEqual("http:/google.com");
    });

    function buildMockedRequest(acceptType,method){
        method || (method = "GET");
        return new MockReq({
            headers : {
                "accept" : acceptType,
            },
            "method" : method,
            context : {
                route : {
                    compress : false
                },
                app:{
                    compress : false
                }
            }
        });
    }
});