const MockRes = require('mock-res');
const MockReq = require('mock-req');
const StreamMeter = require("../src/streamMeter")

describe ('Stream Meter', () => {

    it('should allow request with small body', (done) => {
        
        var request  = new MockReq({
            method: "POST",
            url: '/test'
        });

        var response = new MockRes();

        response.on('finish', function() {
            expect(response._getString() ).toEqual("data sent in request");
            expect(response.statusCode ).toEqual(200);
            done();
        });

        var stream = StreamMeter({
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

        request.write("data sent in request");
        request.end();
    });
    

    it('should not allow request with big body', (done) => {
        
        var request  = new MockReq({
            method: "POST",
            url: '/test'
        });

        var response = new MockRes();

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
            request.write("data sent in request");
        //}).toThrowError("Unhandled error. (exceeded maxlength)");

    });


});