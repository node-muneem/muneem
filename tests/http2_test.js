var path = require('path')
var fs = require('fs')
var chai = require('chai')
var h2url = require('h2url');
const getStream = require('get-stream')

const Muneem = require("../src/muneem");

describe ('Muneem server', () => {

    //Muneem.setLogger(console);
    const muneem = Muneem({
        mappings : path.join(__dirname , "app/mappings/")
    });
    muneem.addHandler("main", async (asked,answer) => {
        //answer.setHeader("id", asked.id);
        answer.write("I'm glad to response you back with " + await asked.readBody());
    } ) ;
    muneem.addHandler("post", (asked,answer) => {} ) ;
    muneem.addHandler("parallel", (asked,answer) => {} ) ;
    muneem.addHandler("auth", (asked,answer) => {} ) ;
    muneem.addHandler("stream", (asked,answer) => {} ) ;
    muneem.addHandler("invalid", (asked,answer) => {
        asked.invalid();
    } ) ;

    muneem.routesManager.addRoute({
        when : "POST",
        uri: "/test",
        to: "main"
    })

    muneem.routesManager.addRoute({
        uri: "/invalid",
        to: "invalid"
    })

    afterAll(() => {
        //muneem.server.close();
    });

    it('should response back politely ;)',async () => {

            /* const res = await h2url.concat({ url : "http://localhost:3003/test" })
            console.log(res) */

        muneem.start({
            port: 3003,
            http2 : true,
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

    it('should response back politely ;)',async () => {

        /* const res = await h2url.concat({ url : "http://localhost:3003/test" })
        console.log(res) */
        muneem.options.mappings = undefined;

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