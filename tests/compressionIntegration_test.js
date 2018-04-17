const MockReq = require('mock-req');
const MockRes = require('mock-res');
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');
const Muneem = require("../src/muneem")

describe ('Muneem', () => {
    
    describe ('with default compression', () => {
        
        it('should not compress for header: x-no-compression', (done) => {

            const muneem = Muneem({
                compress : {
                    threshold : 10
                }
            });
            
            muneem.addHandler("main", (asked,answer) => {
                answer.write("main method is called");
            } ) ;

            const routesManager = muneem.routesManager;
            
            muneem.route({
                uri: "/test",
                to: "main"
            });

            var request  = new MockReq({
                url: '/test',
                headers : {
                    "accept-encoding" : "deflat, gzip",
                    "x-no-compression" : "true"
                }
            });

            var response = new MockRes();

            response.on('finish', function() {
                expect(response._getString() ).toEqual("main method is called");
                expect(response.statusCode ).toEqual(200);
                done();
            });

            routesManager.router.lookup(request,response);

        });

        it('should not compress for header: cache-control sets to no-transform', (done) => {

            const muneem = Muneem({
                compress : {
                    threshold : 10
                }
            });
            
            muneem.addHandler("main", (asked,answer) => {
                answer.write("main method is called");
            } ) ;

            const routesManager = muneem.routesManager;
            
            muneem.route({
                uri: "/test",
                to: "main"
            });

            var request  = new MockReq({
                url: '/test',
                headers : {
                    "accept-encoding" : "deflat, gzip",
                    "cache-control" : "no-transform"
                }
            });

            var response = new MockRes();

            response.on('finish', function() {
                expect(response._getString() ).toEqual("main method is called");
                expect(response.statusCode ).toEqual(200);
                done();
            });

            routesManager.router.lookup(request,response);

        });

        it('should not compress small payload', (done) => {
            const muneem = Muneem();
            
            muneem.addHandler("main", (asked,answer) => {
                answer.write("main");
            } ) ;

            const routesManager = muneem.routesManager;
            
            muneem.route({
                uri: "/test",
                to: "main"
            });

            var request  = new MockReq({
                url: '/test',
                headers : {
                    "accept-encoding" : "deflat, gzip"
                }
            });

            var response = new MockRes();

            response.on('finish', function() {
                expect(response._getString() ).toEqual("main");
                expect(response.statusCode ).toEqual(200);
                done();
            });

            routesManager.router.lookup(request,response);

        });

        it('should compress big payload', (done) => {

            const muneem = Muneem({
                compress : {
                    threshold : 10
                }
            });
            
            muneem.addHandler("main", (asked,answer) => {
                answer.write("main method is called");
            } ) ;

            const routesManager = muneem.routesManager;
            
            muneem.route({
                uri: "/test",
                to: "main"
            });

            var request  = new MockReq({
                url: '/test',
                headers : {
                    "accept-encoding" : "deflat, gzip"
                }
            });

            var response = new MockRes();

            response.on('finish', function() {
                expect(zlib.inflateSync( Buffer.concat(response._responseData) ).toString() ).toEqual("main method is called");
                expect(response.statusCode ).toEqual(200);
                done();
            });

            routesManager.router.lookup(request,response);

           
        });
    });
    
    describe ('with custom compression options ', () => {

        it('should compress payload with given preference', (done) => {

            const muneem = Muneem({
                compress : {
                    threshold : 10,
                    preference : "gzip"
                }
            });
            
            muneem.addHandler("main", (asked,answer) => {
                answer.write("main method is called");
            } ) ;

            const routesManager = muneem.routesManager;
            
            muneem.route({
                uri: "/test",
                to: "main"
            });

            var request  = new MockReq({
                url: '/test',
                headers : {
                    "accept-encoding" : "deflat, gzip"
                }
            });

            var response = new MockRes();

            response.on('finish', function() {
                expect(zlib.gunzipSync( Buffer.concat(response._responseData) ).toString() ).toEqual("main method is called");
                expect(response.statusCode ).toEqual(200);
                done();
            });

            routesManager.router.lookup(request,response);
           
        });

        it('should compress stream with given preference', (done) => {

            //create a file to test
            fs.writeFileSync(path.resolve(__dirname, "fileToDownload"), "This file is ready for download");

            const muneem = Muneem({
                compress : {
                    threshold : 10,
                    preference : "gzip"
                }
            });
            
            muneem.addHandler("main", (asked,answer) => {
                const readStream = fs.createReadStream(path.resolve(__dirname, "fileToDownload"));
                answer.write(readStream);
            } ) ;

            const routesManager = muneem.routesManager;
            
            muneem.route({
                uri: "/test",
                to: "main"
            });

            var request  = new MockReq({
                url: '/test',
                headers : {
                    "accept-encoding" : "deflat, gzip"
                }
            });

            var response = new MockRes();

            response.on('finish', function() {
                expect(zlib.gunzipSync( Buffer.concat(response._responseData) ).toString() ).toEqual("This file is ready for download");
                expect(response.statusCode ).toEqual(200);
                done();
            });

            routesManager.router.lookup(request,response);
           
        });

        it('should throw error when given preference is not registered', () => {

            const muneem = Muneem({
                compress : {
                    threshold : 10,
                    preference : "br"
                }
            });
            
            muneem.addHandler("main", (asked,answer) => {
                answer.write("main");
            } ) ;

            expect(() => {
                muneem.route({
                    uri: "/test",
                    to: "main"
                });
            }).toThrowError("Unregistered compression type is set in preference : br");
           
        });

        it('should not compress when custom filter returns false', (done) => {

            const muneem = Muneem({
                compress : {
                    threshold : 10,
                    preference : "gzip",
                    filter : () => {
                        return false;
                    }
                }
            });
            
            muneem.addHandler("main", (asked,answer) => {
                answer.write("main method is called");
            } ) ;

            const routesManager = muneem.routesManager;
            
            muneem.route({
                uri: "/test",
                to: "main"
            });

            var request  = new MockReq({
                url: '/test',
                headers : {
                    "accept-encoding" : "deflat, gzip"
                }
            });

            var response = new MockRes();

            response.on('finish', function() {
                expect(response._getString() ).toEqual("main method is called");
                expect(response.statusCode ).toEqual(200);
                done();
            });

            routesManager.router.lookup(request,response);
           
        });

        it('should not compress stream when custom filter returns false', (done) => {

            //create a file to test
            fs.writeFileSync(path.resolve(__dirname, "fileToDownload"), "This file is ready for download");

            const muneem = Muneem({
                compress : {
                    threshold : 10,
                    preference : "gzip",
                    filter : () => {
                        return false;
                    }
                }
            });
            
            muneem.addHandler("main", (asked,answer) => {
                const readStream = fs.createReadStream(path.resolve(__dirname, "fileToDownload"));
                answer.write(readStream);
            } ) ;

            const routesManager = muneem.routesManager;
            
            muneem.route({
                uri: "/test",
                to: "main"
            });

            var request  = new MockReq({
                url: '/test',
                headers : {
                    "accept-encoding" : "deflat, gzip"
                }
            });

            var response = new MockRes();

            response.on('finish', function() {
                expect(response._getString() ).toEqual("This file is ready for download");
                expect(response.statusCode ).toEqual(200);
                done();
            });

            routesManager.router.lookup(request,response);
           
        });

    });
});