const httpMocks = require('node-mocks-http');
const eventEmitter = require('events').EventEmitter;
const StreamMeter = require("../../src/streamMeter")

describe ('Stream Meter', () => {

    it('should allow request with small body', (done) => {
        
        var request  = httpMocks.createRequest({
            url: '/test'
        });

        var response = httpMocks.createResponse({
            eventEmitter: require('events').EventEmitter
        });

        response.on('end', function() {
            expect(response._getData() ).toEqual("data sent in request");
            expect(response.statusCode ).toEqual(200);
            expect(response._isEndCalled()).toBe(true);
            done();
        });

        var stream = new StreamMeter({
            maxLength : 50,
        })
        request.pipe(stream);
    
        request.body = [];
        stream.on('data', (chunk)=>request.body.push(chunk));
        stream.on('end', ()=>{
            request.body = Buffer.concat(request.body);
            response.setHeader("content-length", request.body.length);
            response.end(request.body);
        });
        stream.on('end', (err)=>{
        });

        request.send("data sent in request");

    });
    

    it('should not allow request with big body', (done) => {
        
        var request  = httpMocks.createRequest({
            url: '/test'
        });

        var response = httpMocks.createResponse({
            eventEmitter: require('events').EventEmitter
        });

        var stream = new StreamMeter({
            maxLength : 5,
            errorHandler : (errmsg) => {
                expect(errmsg).toEqual("exceeded maxlength");
                done()
            }
        })
        request.pipe(stream);
    
        request.body = [];
        stream.on('data', (chunk)=>request.body.push(chunk));
        stream.on('end', ()=>{
            request.body = Buffer.concat(request.body);
            response.setHeader("content-length", request.body.length);
            response.end(request.body);
        });
        stream.on('end', (err)=>{
        });

        //expect( () => {
            request.send("data sent in request");
        //}).toThrowError("Unhandled error. (exceeded maxlength)");

    });


});