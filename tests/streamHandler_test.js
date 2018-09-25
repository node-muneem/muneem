const path = require("path");
const fs = require("fs");
const zlib = require("zlib");
const MockReq = require('mock-req');
const MockRes = require('mock-res');
const pump = require('pump')
const eventEmitter = require('events').EventEmitter;
const Muneem = require("../src/muneem")

describe ('Muneem', () => {

    it('should error when the length of incoming stream is more than allowed', (done) => {
        
        const muneem = Muneem();

        muneem.addHandler("fileUploader", (asked,answer) => {
            fileWritableStream = fs.createWriteStream(path.resolve(__dirname, "filename"));
            asked.stream.pipe(fileWritableStream);
        }) ;

        const routesManager = muneem.routesManager;
        routesManager.addRoute({
            uri: "/test",
            when: "POST",
            to: "fileUploader",
            maxLength: 5
        });

        var request = new MockReq({
            method: 'POST',
            url: '/test'
        });

        var response = new MockRes();

        response.on('finish', function() {
            expect(response._getString() ).toEqual("");
            expect(response.statusCode ).toEqual(413);
            //expect(response.statusMessage ).toEqual("request entity too large");
            done();
        });
        routesManager.router.lookup(request,response);

        request.write("data sent in request");
        request.end()

    });

    it('should error when Internal server error', (done) => {
        
        const muneem = Muneem();

        muneem.addHandler("fileUploader", 
            (asked,answer) => {
                //FS is not defined
                fileWritableStream = FS.createWriteStream(path.resolve(__dirname, "filename"));
                asked.stream.pipe(fileWritableStream);
            }) ;

        const routesManager = muneem.routesManager;
        routesManager.addRoute({
            uri: "/test",
            when: "POST",
            to: "fileUploader",
            maxLength: 50
        });

        var request = new MockReq({
            method: 'POST',
            url: '/test'
        });

        var response = new MockRes();

        response.on('finish', function() {
            expect(response._getString() ).toEqual("");
            expect(response.statusCode ).toEqual(500);
            //expect(response.statusMessage ).toEqual("Internal Server Error");
            done();
        });
        routesManager.router.lookup(request,response);

        request.write("data sent in request");
        request.end()

    }); 

    it('should response first than writing input stream in to a file', (done) => {
        
        const muneem = Muneem();

        muneem.addHandler("fileUploader", 
            (asked,answer) => {
                let fileWritableStream = fs.createWriteStream(path.resolve(__dirname, "filename2"));

                fileWritableStream.on("finish", () => {
                    let content = fs.readFileSync(path.resolve(__dirname, "filename2"), "utf8").toString();
                    expect(content).toEqual("data sent in request");
                    done()
                })
                asked.stream.pipe(fileWritableStream);
            }) ;

        const routesManager = muneem.routesManager;
        routesManager.addRoute({
            uri: "/test",
            when: "POST",
            to: "fileUploader",
            maxLength: 50
        });

        var request = new MockReq({
            method: 'POST',
            url: '/test'
        });

        var response = new MockRes();

        response.on('finish', function() {
            let content = fs.readFileSync(path.resolve(__dirname, "filename2"), "utf8").toString();
            expect(content).toEqual("");
            expect(response.statusCode ).toEqual(200);
            done();
        });
        routesManager.router.lookup(request,response);

        request.write("data sent in request");
        request.end()

    });

    it('should response after writing input stream in to a file', (done) => {
        
        const muneem = Muneem();

        muneem.addHandler("fileUploader", 
            async (asked,answer) => {
                await new Promise((resolve, reject) => {
                    let fileWritableStream = fs.createWriteStream(path.resolve(__dirname, "filename"));

                    fileWritableStream.on("finish", () => {
                        let content = fs.readFileSync(path.resolve(__dirname, "filename"), "utf8").toString();
                        expect(content).toEqual("data sent in request");
                        resolve();
                    })

                    asked.stream.pipe(fileWritableStream);
                })
                
            }) ;

        const routesManager = muneem.routesManager;
        routesManager.addRoute({
            uri: "/test",
            when: "POST",
            to: "fileUploader",
            maxLength: 50
        });

        var request = new MockReq({
            method: 'POST',
            url: '/test'
        });

        var response = new MockRes();

        response.on('finish', function() {
            let content = fs.readFileSync(path.resolve(__dirname, "filename"), "utf8").toString();
            expect(content).toEqual("data sent in request");
            expect(response.statusCode ).toEqual(200);
            done();
        });
        routesManager.router.lookup(request,response);

        request.write("data sent in request");
        request.end()

    });

    it('should (single stream handler) download a file from server', (done) => {
        //create file to download
        let fileWritableStream = fs.createWriteStream(path.resolve(__dirname, "fileToDownload"));
        fileWritableStream.write("This file is ready for download");
        fileWritableStream.end();

        const muneem = Muneem();

        muneem.addHandler("fileUploader", 
            (asked,answer) => {
                const filePath = path.resolve(__dirname, "fileToDownload");
                let fileReadableStream = fs.createReadStream(filePath);
                var stat = fs.statSync(filePath);

                answer.type("plain/text")
                //answer.length(stat.size);
                //fileReadableStream.pipe(process.stdout);
                answer.write(fileReadableStream);
        }) ;

        const routesManager = muneem.routesManager;
        routesManager.addRoute({
            uri: "/test",
            to: "fileUploader"
        });

        
        var request = new MockReq({
            url: '/test'
        });

        var response = new MockRes();

        response.on('finish', function() {
            expect(response.getHeader("content-type")).toEqual("plain/text");
            expect(response._getString()).toEqual("This file is ready for download");
            expect(response.statusCode ).toEqual(200);
            done();
        });
        routesManager.router.lookup(request,response);


    });

    it('should (multiple stream handlers) download a compressed file from server', (done) => {
        //create file to download
        let fileWritableStream = fs.createWriteStream(path.resolve(__dirname, "fileToDownload"));
        fileWritableStream.write("This file is ready for download");
        fileWritableStream.end();

        const muneem = Muneem();

        muneem.addHandler("fileUploader", 
            (asked,answer) => {
                const filePath = path.resolve(__dirname, "fileToDownload");
                let fileReadableStream = fs.createReadStream(filePath);
                var stat = fs.statSync(filePath);

                answer.type("plain/text")
                answer.write(fileReadableStream);
        }) ;

        muneem.addHandler("compress", 
            (asked,answer) => {
                answer.write( pump(answer.data,zlib.createGzip() ) );
        }) ;

        const routesManager = muneem.routesManager;
        routesManager.addRoute({
            uri: "/test",
            to: "fileUploader",
            then: "compress"
        });

        const request = new MockReq({
            url: '/test'
        });

        const response = new MockRes();

        let chunks = [];        
        response.on('data', chunk => {
            chunks.push(chunk);
        });
        response.on('finish', function() {
            chunks = Buffer.concat(chunks);
            expect(response.getHeader("content-type")).toEqual("plain/text");
            expect(zlib.gunzipSync(chunks).toString()).toEqual("This file is ready for download");
            expect(response.statusCode ).toEqual(200);
            done();
        });
        routesManager.router.lookup(request,response); 


    });
});