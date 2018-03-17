const Handler = require("../../src/Handler");

describe ('Handler', () => {
    it('should throw error for invalid type', () => {
        
        expect(() => {
            new Handler("test", "invalid");
        }).toThrowError("Handler should be of object or function type only.");
    });

    it('should throw error when given handler don\'t have handle method for invalid type', () => {
        
        expect(() => {
            new Handler("test", {});
        }).toThrowError("Handler should have 'handle' method.");
    });

    it('should create handler to run in sequence', () => {
        const handler = () => { return 56;};
        const appHandler = new Handler("test", handler );

        expect(appHandler.handle()).toEqual(56);
        expect(appHandler.handlesStream).toEqual(undefined);
        expect(appHandler.inParallel).toEqual(undefined);
    });

    it('should create handler from an object to run on stream in sequence', () => {
        const handler = {
            handle : () => { return 56;}
        };
        const appHandler = new Handler("test", handler, {
            handlesStream : true
        } );

        expect(appHandler.handle()).toEqual(56);
        expect(appHandler.handlesStream).toEqual(true);
        expect(appHandler.inParallel).toEqual(undefined);
    });

    it('should create handler from an object to run in parallel', (done) => {
        const handler = {
            handle : () => { done(); return 56;}
        };
        const appHandler = new Handler("test", handler, {
            inParallel : true
        } );

        appHandler.handle();
        expect(appHandler.handlesStream).toEqual(undefined);
        expect(appHandler.inParallel).toEqual(true);
    });

})