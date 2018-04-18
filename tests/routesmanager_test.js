const RoutesManager = require("../src/routesManager");
const Container = require("../src/HandlersContainer");
const Compressors = require("../src/CompressorsContainer");
const path = require("path");

describe ('RoutesManager', () => {
    const container = new Container();
    container.add("__exceedContentLength", () => {});
    container.add("__error", () => {});
    container.add("auth", () => {})
        .add("parallel", () => {})
        .add("stream", { handle : () => {}})
        .add("post", () => {})
        .add("main", () => {});
    
    const containers = {
        handlers : container,
        compressors : new Compressors(),
        streamCompressors : new Compressors()
    }
    let env;
    beforeEach(()=>{
        env = process.env.NODE_ENV;
    });
    
    afterEach(()=>{
        process.env.NODE_ENV = env;
    });

    it('should skip if invalid yaml file is given', () => {
        const options = {
            mappings :  path.join(__dirname , "app/mappings/invalid/invalid.yaml"),
            compress : {
                shouldCompress : false
            }
        };
        const routesManager =new RoutesManager(options,containers);
        
        expect(() => {
            routesManager.addRoutesFromMappingsFile(options.mappings)
        }).toThrowError("There is no route exist. Please check the mapping file or add them from the code.");
    });

    it('should error when not exist file is given', () => {
        const options = {
            mappings : path.join(__dirname , "app/mappings/notfound.yaml"),
            compress : {
                shouldCompress : false
            }
        };
        const routesManager =new RoutesManager(options,containers);

        expect(() => {
            routesManager.addRoutesFromMappingsFile(options.mappings)
        }).toThrow();

    });

    it('should skip non-yaml file and mappings for different environment', () => {
        const options = {
            mappings : path.join(__dirname , "app/mappings/"),
            alwaysReadRequestPayload: true,
            compress : {
                shouldCompress : false
            }
        };
        const routesManager =new RoutesManager(options,containers);
        routesManager.addRoutesFromMappingsFile(options.mappings);
        
        expect(routesManager.router.count).toEqual(7);

        expect(routesManager.router.find("GET", "/in/dev").name).toEqual("defaultRoute"); 
        expect(routesManager.router.find("GET", "/in/test").name).toEqual("defaultRoute"); 

    });

    it('should let user add route through code', () => {
        const options = {
            mappings : path.join(__dirname , "app/mappings/"),
            alwaysReadRequestPayload: true,
            compress : {
                shouldCompress : false
            }
        };
        const routesManager =new RoutesManager(options,containers);

        routesManager.addRoutesFromMappingsFile(options.mappings);
        routesManager.addRoute({
            uri: "/route/from/code",
            to : "main"
        });
        /* routesManager.handlers.add("__defaultRoute",new Handler("__defaultRoute",(req,res)=>{
            expect(req.url).toBe("/in/dev")     
            done();
        })); */
        expect(routesManager.router.count).toEqual(8);

        expect(routesManager.router.find("GET", "/in/dev").name).toEqual("defaultRoute"); 
        expect(routesManager.router.find("GET", "/in/test").name).toEqual("defaultRoute"); 
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


    it('should error when then handler is not registered', () => {
        const options = {
            mappings : path.join(__dirname , "app/mappings/invalid/unknownHandler.yaml"),
            compress : {
                shouldCompress : false
            }
        };
        const routesManager =new RoutesManager(options,containers);
        
        expect(() => {
            routesManager.addRoutesFromMappingsFile(options.mappings);
        }).toThrowError("Unregistered handler unknown");

    });

    it('should error when after handler is not registered', () => {
        const routesManager =new RoutesManager({
            compress : {
                shouldCompress : false
            }
        },containers);
        expect(() => {
            routesManager.addRoute({
                after: "unknown"
            });
        }).toThrowError("Unregistered handler unknown");

    });

    it('should error when preferred compression type is not registered', async () => {

        const routesManager =new RoutesManager(null,containers);
        expect(() => {
            routesManager.addRoute({
                compress : {
                    preference : ["br"]
                }
            });
        }).toThrowError("Unregistered compression type is set in preference : br");

    });
});