if (!global.Promise) {
    global.Promise = require('q');
}

var path = require('path')
var chai = require('chai')
, chaiHttp = require('chai-http')
, expected = require('chai').expect;

chai.use(chaiHttp);

const Muneem = require("../src/muneem");

describe ('Muneem server', () => {

    const muneem = Muneem({
        mappings : path.join(__dirname , "app/mappings/")
    });
    muneem.addHandler("main", (asked,answer) => {
        if(asked.headers["header6"]) throw Error("Not expected");
        answer.setHeader("id", "asked.id");
        answer.write("I'm glad to response you back.");
    } ) ;
    muneem.addHandler("post", (asked,answer) => {} ) ;
    muneem.addHandler("parallel", (asked,answer) => {} ) ;
    muneem.addHandler("auth", (asked,answer) => {} ) ;
    muneem.addHandler("stream", (asked,answer) => {} ) ;
    muneem.addHandler("internalError", (asked,answer) => {
        asked.notExist();
    } ) ;

    muneem.route({
        url: "/test",
        to: "main"
    })

    muneem.route({
        url: "/internalError",
        to: "internalError"
    })

    muneem.start({
        generateUniqueReqId : true,
        maxHeadersCount : 5
    });
    

    it('should start and work as expected.', (done) => {
        chai.request("http://localhost:3002")
            .get('/test')
            .then(res => {
                expect(res.status).toBe(200);
                expect(res.headers["id"]).toBe("asked.id");
                expect(res.text).toBe("I'm glad to response you back.");
                done();
            }).catch( err => {
                done.fail("not expected " + err);
            });
    });

    it('should response back with 500 when internal error.', (done) => {
        chai.request("http://localhost:3002")
            .get('/internalError')
            .then(res => {
                expect(res.status).toBe(500);
                done();
            }).catch( err => {
                done.fail("not expected " + err);
            });
    });

    it('should not allow more than 5 headers', () => {
        chai.request("http://localhost:3002")
            .get('/test')
            .set("header1","value1")
            .set("header2","value2")
            .set("header3","value3")
            .set("header4","value4")
            .set("header5","value5")
            .set("header6","value6") //will be skipped
            .then(res => {
                expect(res.status).toBe(200);
                done();
            }).catch( err => {
                done.fail("not expected " + err);
            });
    });

    //TODO: assert
    it('should error back when port is busy', () => {

       /* const  fakelogger = {
            error : errmsg =>{
                console.log(errmsg);
                expect(errmsg).toEqual("EADDRINUSE: Port 3002 is already in use.")
                done();
            },
            debug : () => {},
            info : () => {},
            warn : () => {},
        }
        Muneem.setLogger(fakelogger); */
        const muneem = Muneem();
        muneem.start();//EADDRINUSE: Port 3002 is already in use.
    });

    //TODO: assert
     it('should error back when port is not accessible', () => {
        const muneem = Muneem();

        muneem.start(8);
        //EACCES: Permission denied to use port 8
    });

    //TODO: assert
    it('should error back when invalid host', () => {
        const muneem = Muneem();

        muneem.start({
            host : "invalid" 
        });
        //ENOTFOUNDEADDRNOTAVAILD: Host "invalid" is not available.
    });

});