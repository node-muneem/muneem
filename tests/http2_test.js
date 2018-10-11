var path = require('path')
var fs = require('fs')
var chai = require('chai')
var h2url = require('h2url');
const getStream = require('get-stream')

const Muneem = require("../src/muneem");

describe ('HTTP2', () => {

    it('should work fine',async () => {

        const muneem = Muneem({
            mappings : path.join(__dirname , "app/mappings/"),
        });
        
        buildServer(muneem);

        muneem.start({
            port: 3003,
            http2 : true
        });

        const res = await h2url.request({
            method: "POST",
            url : "http://localhost:3003/test",
            body: "some sample data"
        })
        //console.log(res.headers)
        expect(res.headers[":status"]).toEqual(200);
        expect(res.headers["content-length"]).toEqual('51');
        const body = await getStream(res.stream);
        expect(body).toEqual("I'm glad to response you back with some sample data");
    });

    it('should work fine for secure connection',async () => {
        
        const muneem = Muneem({
            mappings : path.join(__dirname , "app/mappings/"),
        });
        
        buildServer(muneem);

        muneem.start({
            port: 3004,
            http2 : true,
            https : buildSecureServerConfig()
        });

        const res = await h2url.request({
            method: "POST",
            url : "https://localhost:3004/test",
            body: "some sample data"
        })
        //console.log(res.headers)
        expect(res.headers[":status"]).toEqual(200);
        expect(res.headers["content-length"]).toEqual('51');
        const body = await getStream(res.stream);
        expect(body).toEqual("I'm glad to response you back with some sample data");
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
        answer.write("I'm glad to response you back with " + await asked.readBody());
    } ) ;
    app.addHandler("post", (asked,answer) => {} ) ;
    app.addHandler("parallel", (asked,answer) => {} ) ;
    app.addHandler("auth", (asked,answer) => {} ) ;
    app.addHandler("stream", (asked,answer) => {} ) ;
    app.addHandler("invalid", (asked,answer) => {
        asked.invalid();
    } ) ;

    app.routesManager.addRoute({
        when : "POST",
        url: "/test",
        to: "main"
    })

    app.routesManager.addRoute({
        url: "/invalid",
        to: "invalid"
    })
}