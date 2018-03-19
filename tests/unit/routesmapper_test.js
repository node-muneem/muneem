const routesMapper = require("../../src/routesMapper");
const HandlersMap = require("../../src/HandlersMap");
const path = require("path");
const Router = require('find-my-way');

describe ('RoutesMapper', () => {
    const handlers = new HandlersMap();
    handlers.add("auth", () => 30).toHandle("request")
    handlers.add("parallel", () => 30)
    handlers.add("stream", () => 30).toHandle("requestDataStream")
    handlers.add("post", () => 30).toHandle("response")
    handlers.add("main", () => 30).toHandle("requestData")

    let env;
    beforeEach(()=>{
        env = process.env.NODE_ENV;
    });
    
    afterEach(()=>{
        process.env.NODE_ENV = env;
    });

    it('should skip if invalid yaml file is given', () => {
        const router = Router();
        const options = {
            mappings :  path.join(__dirname , "app/mappings/invalid/invalid.yaml")
        };
        routesMapper.mapRoutes(router,options);
        expect(router.routes).toEqual([]);

    });

    it('should error when not exist file is given', () => {
        const router = Router();
        const options = {
            mappings : path.join(__dirname , "app/mappings/notfound.yaml")
        };

        expect(() => {
            routesMapper.mapRoutes(router,options);
        }).toThrow();

    });

    it('should skip non-yaml file and mappings for different environment', () => {
        const router = Router();
        const options = {
            mappings : path.join(__dirname , "app/mappings/"),
            alwaysReadRequestPayload: true
        };
        routesMapper.mapRoutes(router,options,handlers);
        expect(router.routes.length).toEqual(7);

        router.routes.forEach(r => {
            expect(r.path).not.toEqual("/in/dev");
            expect(r.path).not.toEqual("/in/test");
        })

    });

    it('should read mappings for the mentioned envirnment', () => {
        process.env.NODE_ENV = "dev"
        const router = Router();
        const options = {
            mappings : path.join(__dirname , "app/mappings/"),
            alwaysReadRequestPayload: true
        };
        routesMapper.mapRoutes(router,options,handlers);
        expect(router.routes.length).toEqual(8);

        expect(router.routes[4].path).toEqual("/in/dev");
        router.routes.forEach(r => {
            expect(r.path).not.toEqual("/in/test");
        })

    });


    it('should error when handler is not registered', () => {
        const router = Router();
        const options = {
            mappings : path.join(__dirname , "app/mappings/invalid/unknownHandler.yaml")
        };
        
        expect(() => {
            routesMapper.mapRoutes(router,options,handlers);
        }).toThrowError("Unregistered handler unknown");

    });

    it('should error when multiple stream handlers are called', () => {
        const router = Router();
        const options = {
            mappings : path.join(__dirname , "app/mappings/invalid/lateStreamHandler.yaml"),
            alwaysReadRequestPayload: true
        };
        
        expect(() => {
            routesMapper.mapRoutes(router,options,handlers);
        }).toThrowError("MappingError: There is only one request stream handler per mapping allowed.");

    });

    it('should error when multiple stream handlers are called', () => {
        const router = Router();
        const options = {
            mappings : path.join(__dirname , "app/mappings/invalid/invalidResponseHandler.yaml")
        };
        
        expect(() => {
            routesMapper.mapRoutes(router,options,handlers);
        }).toThrowError("Ah! wrong place for parallel. Only response handlers are allowed here.");

    });

    it('should error when handler wants to read request body for GET or HEAD method', () => {
        const router = Router();
        const options = {
            mappings : path.join(__dirname , "app/mappings/")
        };
        expect(() => {
            routesMapper.mapRoutes(router,options,handlers);
        }).toThrowError("Set alwaysReadRequestPayload if you want to read request body/payload for GET and HEAD methods");

    });


});