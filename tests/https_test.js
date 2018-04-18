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

describe ('Muneem server', () => {

    const muneem = Muneem({
        mappings : path.join(__dirname , "app/mappings/")
    });
    muneem.addHandler("main", (asked,answer) => {
        answer.write("I'm glad to response you back.");
    } ) ;
    muneem.addHandler("post", (asked,answer) => {} ) ;
    muneem.addHandler("parallel", (asked,answer) => {} ) ;
    muneem.addHandler("auth", (asked,answer) => {} ) ;
    muneem.addHandler("stream", (asked,answer) => {} ) ;
    muneem.addHandler("invalid", (asked,answer) => {
        asked.invalid();
    } ) ;

    muneem.routesManager.addRoute({
        uri: "/test",
        to: "main"
    })

    muneem.routesManager.addRoute({
        uri: "/invalid",
        to: "invalid"
    })

    beforeAll(() => {
        muneem.start({
            https : buildSecureServerConfig(),
            port: 3005
        });
   });

    afterAll(() => {
        muneem.server.close();
     });

    it('should response back politely ;)', (done) => {
        chai.request("https://localhost:3005")
            .get('/test')
            .ca(fs.readFileSync(path.join(__dirname, "truststore/ca.crt") ) )
            .then(res => {
                expect(res.status).toBe(200);
                expect(res.text).toBe("I'm glad to response you back.");
                done();
            }).catch( err => {
                done.fail("not expected " + err);
            });
    });
});

function buildSecureServerConfig(config){
    const options = {
        key: fs.readFileSync(path.join(__dirname, "truststore/server.key")),
        cert: fs.readFileSync(path.join(__dirname, "truststore/server.crt"))
    };
    /* if(config.server.ca){
        options.ca = [];
        config.server.ca.forEach(function(cert){
            options.ca.push(fs.readFileSync(cert));
        });
    }
    if(config.server.mutualSSL === true){
        options.requestCert= true;
        options.rejectUnauthorized= true;
    } */

    return options;
}