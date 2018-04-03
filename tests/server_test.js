if (!global.Promise) {
    global.Promise = require('q');
}

var path = require('path')
var chai = require('chai')
, chaiHttp = require('chai-http')
, expected = require('chai').expect;

chai.use(chaiHttp);

const Muneem = require("../src/muneem");
//const path = require("path");

describe ('Muneem server', () => {

    const muneem = Muneem({
        mappings : path.join(__dirname , "app/mappings/")
    });
    muneem.addHandler("main", (asked,answer) => {
        answer.setHeader("id", asked.id);
        answer.write("I'm glad to response you back.");
    } ) ;
    muneem.addHandler("post", (asked,answer) => {} ) ;
    muneem.addHandler("parallel", (asked,answer) => {} ) ;
    muneem.addHandler("auth", (asked,answer) => {} ) ;
    muneem.addHandler("stream", (asked,answer) => {} ) ;

    muneem.routesManager.addRoute({
        uri: "/test",
        to: "main"
    })

    beforeAll(() => {
        muneem.start({
            //TODO: test if new id is being set
            generateUniqueReqId : true
        });
    });

    afterAll(() => {
        muneem.server.close();
    });

    it('should response back politely ;)', (done) => {
        chai.request("http://localhost:3002")
            .get('/test')
            .then(res => {
                expect(res.status).toBe(200);
                expect(res.headers["id"]).not.toBe(undefined);
                expect(res.text).toBe("I'm glad to response you back.");
                done();
            }).catch( err => {
                done.fail("not expected " + err);
            });
    });

    it('should error back when port is busy', () => {

       /* const  fakelogger = {
            error : errmsg =>{
                expect(errmsg).toEqual("EADDRINUSE: Port 3002 is already in use.")
                done();
            }
        }
        muneem.setLogger(fakelogger); */
        muneem.start();//EADDRINUSE: Port 3002 is already in use.
    });

    it('should error back when port is not accessible', () => {
        muneem.start({port: 8});//EACCES: Permission denied to use port 8
    });

    it('should error back when invalid host', () => {
        muneem.start({host: "invalid"});//ENOTFOUNDEADDRNOTAVAILD: Host "invalid" is not available.
    });

    it('should response back politely ;)', (done) => {
        chai.request("http://localhost:3000")
            .get('/test')
            .then(res => {
                done().fail();
            }).catch( err => {
                expect(err.message).toEqual("connect ECONNREFUSED 127.0.0.1:3000");
                done();
            });
    });

});