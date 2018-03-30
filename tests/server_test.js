if (!global.Promise) {
    global.Promise = require('q');
}

var chai = require('chai')
, chaiHttp = require('chai-http')
, expected = require('chai').expect;

chai.use(chaiHttp);

const Muneem = require("../src/muneem");
//const path = require("path");

describe ('Muneem server', () => {

    const muneem = Muneem();
    muneem.addHandler("main", (asked,answer) => {
        answer.write("I'm glad to response you back.");
    } ) ;

    muneem.routesManager.addRoute({
        uri: "/test",
        to: "main"
    })
    muneem.start();

    it('should response back politely ;)', (done) => {
        chai.request("http://localhost:3002")
            .get('/test')
            .then(res => {
                expect(res.status).toBe(200);
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