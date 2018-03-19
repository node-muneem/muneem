const Handler = require("../../src/Handler");

describe ('Handler', () => {
    it('should throw error for invalid type', () => {
        
        expect(() => {
            new Handler("invalid");
        }).toThrowError("Handler should be of object or function type only.");
    });

    it('should throw error when given handler don\'t have handle method for invalid type', () => {
        
        expect(() => {
            new Handler({});
        }).toThrowError("Handler should have 'handle' method.");
    });

    it('should create handler to run in sequence', () => {
        const handler = () => { return 56;};
        const appHandler = new Handler(handler );

        expect(appHandler.handle()).toEqual(56);
        //expect(appHandler.handlesStream).toEqual(undefined);
        expect(appHandler.inParallel).toEqual(undefined);
    });

    it('should create handler from an object to run on stream in sequence', () => {
        const handler = {
            handle : () => { return 56;}
        };
        const appHandler = new Handler(handler);
        appHandler.toHandle("requestDataStream");

        expect(appHandler.handle()).toEqual(56);
        expect(appHandler.type).toEqual("requestDataStream");
        expect(appHandler.inParallel).toEqual(undefined);
    });

    it('should create handler from an object to run in parallel', (done) => {
        const handler = {
            handle : (a) => { done(); return a;}
        };
        const appHandler = new Handler(handler, {
            inParallel : true
        } );

        appHandler.handle(56);
        expect(appHandler.handlesStream).toEqual(undefined);
        expect(appHandler.inParallel).toEqual(true);
    });

})