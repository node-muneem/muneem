if (!global.Promise) {
    global.Promise = require('q');
}

const path = require('path');
const fs = require('fs');
const chai = require('chai')
, chaiHttp = require('chai-http')
, expected = require('chai').expect;

chai.use(chaiHttp);

const Muneem = require("../src/muneem");

describe ('fatBody custom handler', () => {

    const muneem = Muneem();

    muneem.addHandler("main", async (asked,answer) => {
        await asked.readBody();
        answer.write("I'm happy to response back");
    } ) ;

    muneem.setFatBodyHandler( (asked, answer) => {
        expect( asked._native.url ).toEqual("/wrongUrl");
        answer.close(200,"no router was found");
        throw Error("I don't like fat bodies")
    })

    //previous handler should be overwritten by this
    muneem.setFatBodyHandler( (asked, answer) => {
        expect( asked._native.url ).toEqual("/small");
        answer.close(500,"no router was found");
        throw Error("I don't like fat bodies")
    })

    muneem.on("fatbody", asked => {
        expect( asked._native.url ).toEqual("/small");
    });
    
    muneem.route({
        url: "/small",
        when: "POST",
        to: "main",
        maxLength: 20
    });

    muneem.start(3006);

    it('should 500 on big body.', (done) => {

        chai.request("http://localhost:3006")
            .post('/small')
            .send("This is really big body than expected")
            .then(res => {
                expect(res.status).toBe(500);
                expect(res.text).toBe("");
                expect(res.header["rejected"]).toBe(undefined);
                done();
            }).catch( err => {
                done.fail("not expected " + err);
            });
    });
    
    it('should 500 if content length header is set to be bigger.', (done) => {
        chai.request("http://localhost:3006")
            .post('/small')
            .set( "content-length", 30)
            .send("wrong header")
            .then(res => {
                expect(res.status).toBe(500);
                expect(res.text).toBe("");
                expect(res.header["rejected"]).toBe(undefined);
                done();
            }).catch( err => {
                done.fail("not expected " + err);
            });
    });
});