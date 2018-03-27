const RoutesManager = require("../../src/routesManager");
const HandlersMap = require("../../src/Container");
const Handler = require("../../src/Handler");
const path = require("path");
const httpMocks = require('node-mocks-http');
const eventEmitter = require('events').EventEmitter;
const Muneem = require("../../src/muneem")

describe ('Routes Manager', () => {

    it('should call blocks in defined order with default stream reader', (done) => {
        
        const muneem = Muneem({
            alwaysReadRequestPayload: true
        });

        let blocks = [];

        muneem.addHandler("auth", () => {blocks.push("auth")} ) ;
        muneem.addHandler("parallel", () => {
            blocks.push("parallel");
            expect(blocks).toEqual([ 'auth', 'main', 'post', 'last', 'parallel' ]);
            done();
        },{inParallel : true} ) ;
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

    it('should call blocks in defined order with default stream reader for methods which may have body', (done) => {
        
        const muneem = Muneem();
        let blocks = [];

        muneem.addHandler("auth", () => {blocks.push("auth")} ) ;
        muneem.addHandler("parallel", () => {
            blocks.push("parallel");
            expect(blocks).toEqual([ 'auth', 'main', 'post', 'last', 'parallel' ]);
            done();
        },{inParallel : true} ) ;
        muneem.addHandler("main", (asked,answer) => {
            answer.write(asked.body);
            blocks.push("main")
        } ) ;
        muneem.addHandler("post", () => {blocks.push("post")} );
        muneem.addHandler("last", () => {blocks.push("last")} ) ;

        const routesManager = muneem.routesManager;
        
        routesManager.addRoute({
            uri: "/test",            to: "main",
            when: ["POST"],            after: ["auth", "parallel"],
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
            expect(blocks).toEqual([ 'auth',  'main', 'post', 'last']);
        });
        routesManager.router.lookup(request,response);

        request.send("data sent in request");

    });

    it('should call blocks in defined order with custom stream reader', (done) => {
        
        const muneem = Muneem({
            alwaysReadRequestPayload: true
        });

        let blocks = [];

        function streamHandler(){}
        streamHandler.prototype.before= (asked,answer) => {
                blocks.push("stream");
                this.asked = asked;
            },
        streamHandler.prototype.handle= (chunk) => { this.asked.body.push(chunk); }
        streamHandler.prototype.after= (chunk) => { this.asked.body = Buffer.concat(this.asked.body); }

        muneem.addHandler("auth", () => {blocks.push("auth")} ) ;
        muneem.addHandler("parallel", () => {
            blocks.push("parallel");
            expect(blocks).toEqual([ 'auth', 'stream', 'main', 'post', 'last', 'parallel' ]);
            done();
        },{inParallel : true} ) ;
        muneem.addHandler("stream",new streamHandler(), { handlesStream : true} ) ;
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
            after: ["auth", "parallel", "stream"],
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
            expect(blocks).toEqual([ 'auth', 'stream', 'main', 'post', 'last']);
        });
        routesManager.router.lookup(request,response);

        request.send("data sent in request");

    });

    it('should call pre/post handlers but not on default stream, parallem and main handler', (done) => {
        
        const muneem = Muneem();
        let blocks = [];

        muneem.addHandler("auth", () => {blocks.push("auth")} ) ;
        muneem.addHandler("parallel", () => {
            blocks.push("parallel");
            expect(blocks).toEqual([ 
                "Pre: before auth", 'auth' ,"Pre: after auth",
                'main', 
                'Post: before post' , 'post', 'Post: after post',
                'Post: before last', 'last', 'Post: after last',
                'parallel'
            ]);
            done();
        },{inParallel : true} ) ;
        muneem.addHandler("main", (asked,answer) => {
            answer.write(asked.body);
            blocks.push("main")
        } ) ;
        muneem.addHandler("post", () => {blocks.push("post")} );
        muneem.addHandler("last", () => {blocks.push("last")} ) ;

        const routesManager = muneem.routesManager;
        muneem.beforeEachPreHandler((asked,context, handlerName) => {
            blocks.push("Pre: before " + handlerName)
        });
        muneem.afterEachPreHandler((asked,context, handlerName) => {
            blocks.push("Pre: after " + handlerName)
        });

        muneem.beforeEachPostHandler((asked,context, handlerName) => {
            blocks.push("Post: before " + handlerName)
        });
        muneem.afterEachPostHandler((asked,context, handlerName) => {
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
            expect(response._getData() ).toEqual("data sent in request");
            expect(response.statusCode ).toEqual(200);
            expect(response._isEndCalled()).toBe(true);
            expect(blocks).toEqual([ 
                "Pre: before auth", 'auth' ,"Pre: after auth",
                'main', 
                'Post: before post' , 'post', 'Post: after post',
                'Post: before last', 'last', 'Post: after last'
            ]);
        });
        routesManager.router.lookup(request,response);

        request.send("data sent in request");

    });

    it('should call pre/post handlers with custom stream handler but not on parallem and main handler', (done) => {
        
        const muneem = Muneem();
        let blocks = [];

        function streamHandler(){}
        streamHandler.prototype.before= (asked,answer) => {
                blocks.push("stream");
                this.asked = asked;
            },
        streamHandler.prototype.handle= (chunk) => { this.asked.body.push(chunk); }
        streamHandler.prototype.after= (chunk) => { this.asked.body = Buffer.concat(this.asked.body); }

        muneem.addHandler("auth", () => {blocks.push("auth")} ) ;
        muneem.addHandler("parallel", () => {
            blocks.push("parallel");
            expect(blocks).toEqual([ 
                "Pre: before auth", 'auth' ,"Pre: after auth",
                "Pre: before stream", 'stream' ,"Pre: after stream",
                'main', 
                'Post: before post' , 'post', 'Post: after post',
                'Post: before last', 'last', 'Post: after last',
                'parallel'
            ]);
            done();
        },{inParallel : true} ) ;
        muneem.addHandler("stream",new streamHandler(), { handlesStream : true} ) ;
        muneem.addHandler("main", (asked,answer) => {
            answer.write(asked.body);
            blocks.push("main")
        } ) ;
        muneem.addHandler("post", () => {blocks.push("post")} );
        muneem.addHandler("last", () => {blocks.push("last")} ) ;

        const routesManager = muneem.routesManager;
        muneem.beforeEachPreHandler((asked,context, handlerName) => {
            blocks.push("Pre: before " + handlerName)
        });
        muneem.afterEachPreHandler((asked,context, handlerName) => {
            blocks.push("Pre: after " + handlerName)
        });

        muneem.beforeEachPostHandler((asked,context, handlerName) => {
            blocks.push("Post: before " + handlerName)
        });
        muneem.afterEachPostHandler((asked,context, handlerName) => {
            blocks.push("Post: after " + handlerName)
        });

        routesManager.addRoute({
            uri: "/test",
            to: "main",
            when: ["POST"],
            after: ["auth", "parallel", "stream"],
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
                "Pre: before auth", 'auth' ,"Pre: after auth",
                "Pre: before stream", 'stream' ,"Pre: after stream",
                'main', 
                'Post: before post' , 'post', 'Post: after post',
                'Post: before last', 'last', 'Post: after last'
            ]);
        });
        routesManager.router.lookup(request,response);

        request.send("data sent in request");

    });

    it('should call pre/post main handlers  but not on any other handle', (done) => {
        
        const muneem = Muneem();
        let blocks = [];

        muneem.addHandler("auth", () => {blocks.push("auth")} ) ;
        muneem.addHandler("parallel", () => {
            blocks.push("parallel");
            expect(blocks).toEqual([ 
                 'auth' ,
                "Main: before main", 'main', "Main: after main",
                'post',
                'last',
                'parallel'
            ]);
            done();
        },{inParallel : true} ) ;
        muneem.addHandler("main", (asked,answer) => {
            answer.write(asked.body);
            blocks.push("main")
        } ) ;
        muneem.addHandler("post", () => {blocks.push("post")} );
        muneem.addHandler("last", () => {blocks.push("last")} ) ;

        const routesManager = muneem.routesManager;
        muneem.beforeMainHandler((asked,context, handlerName) => {
            blocks.push("Main: before " + handlerName)
        });
        muneem.afterMainHandler((asked,context, handlerName) => {
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
               "Main: before main", 'main', "Main: after main",
               'post',
               'last'
           ]);
        });
        routesManager.router.lookup(request,response);

        request.send("data sent in request");

    });

});
