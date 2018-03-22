const RoutesManager = require("../../src/routesManager");
const Container = require("../../src/Container");
const Handler = require("../../src/Handler");
const path = require("path");

describe ('RoutesManager', () => {
    const container = new Container();
    container.add("auth",new Handler("auth", () => {}).toHandle("request"))
    container.add("parallel",new Handler("parallel", () => {}))
    container.add("stream",new Handler("stream", () => {}).toHandle("requestDataStream"))
    container.add("post",new Handler("post", () => {}).toHandle("response"))
    container.add("main",new Handler("main", () => {}).toHandle("requestData"))

    let env;
    beforeEach(()=>{
        env = process.env.NODE_ENV;
    });
    
    afterEach(()=>{
        process.env.NODE_ENV = env;
    });

    it('should skip if invalid yaml file is given', () => {
        const options = {
            mappings :  path.join(__dirname , "app/mappings/invalid/invalid.yaml")
        };
        const routesManager =new RoutesManager(options,container);
        
        expect(() => {
            routesManager.addRoutesFromMappingsFile(options.mappings)
        }).toThrowError("There is no route exist. Please check the mapping file or add them from the code.");
    });

    it('should error when not exist file is given', () => {
        const options = {
            mappings : path.join(__dirname , "app/mappings/notfound.yaml")
        };
        const routesManager =new RoutesManager(options,container);

        expect(() => {
            routesManager.addRoutesFromMappingsFile(options.mappings)
        }).toThrow();

    });

    it('should skip non-yaml file and mappings for different environment', () => {
        const options = {
            mappings : path.join(__dirname , "app/mappings/"),
            alwaysReadRequestPayload: true
        };
        const routesManager =new RoutesManager(options,container);

        routesManager.addRoutesFromMappingsFile(options.mappings);
        
        expect(routesManager.router.routes.length).toEqual(14);

        routesManager.router.routes.forEach(r => {
            expect(r.path).not.toEqual("/in/dev");
            expect(r.path).not.toEqual("/in/test");
        })

    });

    it('should let user add route through code', () => {
        const options = {
            mappings : path.join(__dirname , "app/mappings/"),
            alwaysReadRequestPayload: true
        };
        const routesManager =new RoutesManager(options,container);
        routesManager.addRoutesFromMappingsFile(options.mappings);
        routesManager.addRoute({
            uri: "/route/from/code",
            to : "main"
        });
        expect(routesManager.router.routes.length).toEqual(16);

        routesManager.router.routes.forEach(r => {
            expect(r.path).not.toEqual("/in/dev");
            expect(r.path).not.toEqual("/in/test");
        })

    });

    /* it('should read mappings for the mentioned envirnment', () => {
        process.env.NODE_ENV = "dev"
        const options = {
            mappings : path.join(__dirname , "app/mappings/"),
            alwaysReadRequestPayload: true
        };
        const routesManager =new RoutesManager(options,handlers);
        routesManager.addRoutesFromMappingsFile(options.mappings);
        expect(routesManager.router.routes.length).toEqual(16);

        expect(routesManager.router.routes[8].path).toEqual("/in/dev");
        routesManager.router.routes.forEach(r => {
            expect(r.path).not.toEqual("/in/test");
        })

    }); */


    it('should error when handler is not registered', () => {
        const options = {
            mappings : path.join(__dirname , "app/mappings/invalid/unknownHandler.yaml")
        };
        const routesManager =new RoutesManager(options,container);
        
        expect(() => {
            routesManager.addRoutesFromMappingsFile(options.mappings);
        }).toThrowError("Unregistered handler unknown");

    });

    it('should error when multiple stream handlers are called', () => {
        const options = {
            mappings : path.join(__dirname , "app/mappings/invalid/lateStreamHandler.yaml"),
            alwaysReadRequestPayload: true
        };
        const routesManager =new RoutesManager(options,container);
        
        expect(() => {
            routesManager.addRoutesFromMappingsFile(options.mappings);
        }).toThrowError("MappingError: There is only one request stream handler per mapping allowed.");

    });

    it('should error when multiple stream handlers are called', () => {
        const options = {
            mappings : path.join(__dirname , "app/mappings/invalid/invalidResponseHandler.yaml")
        };
        const routesManager =new RoutesManager(options,container);
        
        expect(() => {
            routesManager.addRoutesFromMappingsFile(options.mappings);
        }).toThrowError("Ah! wrong place for parallel. Only response handlers are allowed here.");

    });

    it('should error when handler wants to read request body for GET or HEAD method', () => {
        const options = {
            mappings : path.join(__dirname , "app/mappings/")
        };
        const routesManager =new RoutesManager(options,container);
        expect(() => {
            routesManager.addRoutesFromMappingsFile(options.mappings);
        }).toThrowError("Set alwaysReadRequestPayload if you want to read request body/payload for GET and HEAD methods (which is not idle)");

    });


});