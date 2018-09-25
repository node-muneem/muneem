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

describe ('HTTPS server', () => {

    it('should work as expected.', (done) => {
        const muneem = Muneem({
            mappings : path.join(__dirname , "app/mappings/"),
            server  : {
                port: 3005,
                https : buildSecureServerConfig()
            }
        });

        buildServer(muneem);

        muneem.start();

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

function buildServer(app){
    app.addHandler("main", async (asked,answer) => {
        //answer.setHeader("id", asked.id);
        answer.write("I'm glad to response you back.");
    } ) ;
    app.addHandler("post", (asked,answer) => {} ) ;
    app.addHandler("parallel", (asked,answer) => {} ) ;
    app.addHandler("auth", (asked,answer) => {} ) ;
    app.addHandler("stream", (asked,answer) => {} ) ;
    app.addHandler("invalid", (asked,answer) => {
        asked.invalid();
    } ) ;

    app.routesManager.addRoute({
        when : "GET",
        uri: "/test",
        to: "main"
    })

    app.routesManager.addRoute({
        uri: "/invalid",
        to: "invalid"
    })
}