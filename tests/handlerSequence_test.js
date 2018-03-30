
//should not call handler further is answer stream is end
const RoutesManager = require("../src/routesManager");
const HandlersMap = require("../src/Container");
//const Handler = require("../src/Handler");
const path = require("path");
const httpMocks = require('node-mocks-http');
const eventEmitter = require('events').EventEmitter;
const Muneem = require("../src/muneem")

describe ('Routes Manager', () => {

    it('should call handlers in defined order', (done) => {
        
        const muneem = Muneem({
            alwaysReadRequestPayload: true
        });

        let blocks = [];

        muneem.addHandler("auth", () => {blocks.push("auth")} ) ;
        muneem.addHandler("parallel", () => {
            setTimeout(() => {
                blocks.push("parallel");
                expect(blocks).toEqual([ 'auth', 'main', 'post', 'last', 'parallel' ]);
                done();
            })
        }) ;
        muneem.addHandler("main", async (asked,answer) => {
            await asked.readBody();
            answer.write(asked.body);
            blocks.push("main")
        } ) ;
        muneem.addHandler("post", () => {blocks.push("post")} );
        muneem.addHandler("last", () => {blocks.push("last")} ) ;

        const routesManager = muneem.routesManager;
        
        routesManager.addRoute({
            uri: "/test",
            to: "main",
            after: ["auth", "parallel"],
            then: ["post", "last"]
        });

        var request  = httpMocks.createRequest({
            url: '/test'
        });

        var response = httpMocks.createResponse({
            eventEmitter: require('events').EventEmitter
        });

        response.on('end', function() {
            expect(response._getData() ).toEqual("data sent in request");
            expect(response.statusCode ).toEqual(200);
            expect(response._isEndCalled()).toBe(true);
            expect(blocks).toEqual([ 'auth',  'main', 'post', 'last']);
        });
        routesManager.router.lookup(request,response);

        request.send("data sent in request");

    });

    it('should call handler in defined order with custom stream reader', (done) => {
        
        const muneem = Muneem({
            alwaysReadRequestPayload: true
        });

        let blocks = [];

        const streamHandler = async (asked,answer) => {
            await new Promise((resolve,reject) => {
                asked.stream.on("data", chunk => {
                    asked.body.push(chunk);
                })
                asked.stream.on("end", () => {
                    asked.body = Buffer.concat(asked.body); 
                    blocks.push("stream");
                    resolve(asked.body);
                })
            } );
        };

        muneem.addHandler("auth", () => {blocks.push("auth")} ) ;
        muneem.addHandler("stream",streamHandler) ;
        muneem.addHandler("main", (asked,answer) => {
            answer.write(asked.body);
            blocks.push("main")
        } ) ;
        muneem.addHandler("post", () => {blocks.push("post")} );
        muneem.addHandler("last", () => {blocks.push("last")} ) ;

        const routesManager = muneem.routesManager;
        
        routesManager.addRoute({
            uri: "/test",
            to: "main",
            after: ["auth", "stream"],
            then: ["post", "last"]
        });

        var request  = httpMocks.createRequest({
            url: '/test'
        });

        var response = httpMocks.createResponse({
            eventEmitter: require('events').EventEmitter
        });

        response.on('end', function() {
            expect(blocks).toEqual([ 'auth', 'stream', 'main', 'post', 'last']);
            expect(response._getData() ).toEqual("data sent in request");
            expect(response.statusCode ).toEqual(200);
            expect(response._isEndCalled()).toBe(true);
            done();
        });
        routesManager.router.lookup(request,response);

        request.send("data sent in request");

    });

    it('should call pre/post handlers but not on main handler', (done) => {
        
        const muneem = Muneem();
        let blocks = [];

        muneem.addHandler("auth", () => {blocks.push("auth")} ) ;
        muneem.addHandler("parallel", () => {
            setTimeout(() => {

                blocks.push("parallel");
                expect(blocks).toEqual([ 
                    "Pre: before auth", 'auth' ,"Pre: after auth",
                    'Pre: before parallel', 'Pre: after parallel',
                    'main', 
                    'Post: before post' , 'post', 'Post: after post',
                    'Post: before last', 'last', 'Post: after last',
                    'parallel'
                ]);
                done();
            },0);
        }) ;
        muneem.addHandler("main", async (asked,answer) => {
            answer.write(await asked.readBody());
            blocks.push("main")
        } ) ;
        muneem.addHandler("post", () => {blocks.push("post")} );
        muneem.addHandler("last", () => {blocks.push("last")} ) ;

        const routesManager = muneem.routesManager;
        muneem.beforeEachPreHandler((asked, handlerName) => {
            blocks.push("Pre: before " + handlerName)
        });
        muneem.afterEachPreHandler((asked, handlerName) => {
            blocks.push("Pre: after " + handlerName)
        });

        muneem.beforeEachPostHandler((asked, handlerName) => {
            blocks.push("Post: before " + handlerName)
        });
        muneem.afterEachPostHandler((asked, handlerName) => {
            blocks.push("Post: after " + handlerName)
        });

        routesManager.addRoute({
            uri: "/test",
            to: "main",
            when: ["POST"],
            after: ["auth", "parallel"],
            then: ["post", "last"]
        });

        var request  = httpMocks.createRequest({
            method: "POST",
            url: '/test'
        });

        var response = httpMocks.createResponse({
            eventEmitter: require('events').EventEmitter
        });

        response.on('end', function() {
            expect(blocks).toEqual([ 
                "Pre: before auth", 'auth' ,"Pre: after auth",
                'Pre: before parallel', 'Pre: after parallel',
                'main', 
                'Post: before post' , 'post', 'Post: after post',
                'Post: before last', 'last', 'Post: after last'
            ]);
            expect(response._getData() ).toEqual("data sent in request");
            expect(response.statusCode ).toEqual(200);
            expect(response._isEndCalled()).toBe(true);
        });
        routesManager.router.lookup(request,response);

        request.send("data sent in request");

    });

    it('should call pre/post handlers including main handler', (done) => {
        
        const muneem = Muneem();
        let blocks = [];

        muneem.addHandler("auth", () => {blocks.push("auth")} ) ;
        
        muneem.addHandler("main", async (asked,answer) => {
            answer.write(await asked.readBody());
            blocks.push("main")
        } ) ;
        muneem.addHandler("post", () => {blocks.push("post")} );
        muneem.addHandler("last", () => {blocks.push("last")} ) ;

        const routesManager = muneem.routesManager;
        muneem.beforeEachHandler((asked, handlerName) => {
            blocks.push("before " + handlerName)
        });
        muneem.afterEachHandler((asked, handlerName) => {
            blocks.push("after " + handlerName)
        });

        routesManager.addRoute({
            uri: "/test",
            to: "main",
            when: ["POST"],
            after: ["auth"],
            then: ["post", "last"]
        });

        var request  = httpMocks.createRequest({
            method: "POST",
            url: '/test'
        });

        var response = httpMocks.createResponse({
            eventEmitter: require('events').EventEmitter
        });

        response.on('end', function() {
            expect(response._getData() ).toEqual("data sent in request");
            expect(response.statusCode ).toEqual(200);
            expect(response._isEndCalled()).toBe(true);
            expect(blocks).toEqual([ 
                "before auth", 'auth' ,"after auth",
                'before main' ,'main', 'after main' ,
                'before post' , 'post', 'after post',
                'before last', 'last', 'after last'
            ]);
            done()
        });
        routesManager.router.lookup(request,response);

        request.send("data sent in request");

    });

    it('should not skip next handlers when response is already ended', (done) => {
        
        const muneem = Muneem();
        let blocks = [];

        muneem.addHandler("auth", () => {blocks.push("auth")} ) ;
        muneem.addHandler("parallel", () => {
            setTimeout(() => {

                blocks.push("parallel");
                expect(blocks).toEqual([ 
                     'auth' ,
                    'Main: before main', 'main', 'Main: after main',
                    'post',
                    'last',
                    'parallel'
                ]);
                done();
            },0);
        }) ;

        muneem.addHandler("main", async (asked,answer) => {
            answer.end(await asked.readBody());
            blocks.push("main")
        } ) ;
        muneem.addHandler("post", () => {blocks.push("post")} );
        muneem.addHandler("last", () => {blocks.push("last")} ) ;

        const routesManager = muneem.routesManager;
        muneem.beforeMainHandler((asked, handlerName) => {
            blocks.push("Main: before " + handlerName)
        });
        muneem.afterMainHandler((asked, handlerName) => {
            blocks.push("Main: after " + handlerName)
        });

        routesManager.addRoute({
            uri: "/test",
            to: "main",
            when: ["POST"],
            after: ["auth", "parallel"],
            then: ["post", "last"]
        });

        var request  = httpMocks.createRequest({
            method: "POST",
            url: '/test'
        });

        var response = httpMocks.createResponse({
            eventEmitter: require('events').EventEmitter
        });

        response.on('end', function() {
            expect(response._getData() ).toEqual("data sent in request");
            expect(response.statusCode ).toEqual(200);
            expect(response._isEndCalled()).toBe(true);
            expect(blocks).toEqual([ 
                'auth' ,
               "Main: before main"
           ]);
        });
        routesManager.router.lookup(request,response);

        request.send("data sent in request");

    });

});
