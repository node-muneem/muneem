const Handler = require("../../src/Handler");

describe ('Handler', () => {
    it('should throw error for invalid type', () => {
        expect(() => {
            new Handler("invalid");
        }).toThrowError("Handler should be of object or function type only.");
    });

    it('should throw error when given handler don\'t have handle method for invalid type', () => {
        expect(() => {
            new Handler("invalid",{});
        }).toThrowError("Handler should have 'handle' method.");
    });

    it('should create handler to run in sequence', () => {
        const obj = { }
        const handler = (arg) => { arg.a = 56;};
        const appHandler = new Handler("valid",handler );

        appHandler.handle(obj);

        expect(obj.a).toEqual(56);
        //expect(appHandler.handlesStream).toEqual(undefined);
        expect(appHandler.inParallel).toEqual(undefined);
    });

    it('should create handler from an object to run on stream in sequence', () => {
        const obj = { }
        const handler = {
            handle : (arg) => { arg.a = 56;}
        };
        const appHandler = new Handler("valid",handler, {
            handlesStream : true
        });

        appHandler.handle(obj);

        expect(obj.a).toEqual(56);
        expect(appHandler.handlesStream).toBe(true);
        expect(appHandler.inParallel).toEqual(undefined);
    });

    it('should error when stream handler is not an object', () => {
        expect(() => {
            new Handler("valid",(arg) => { arg.a = 56;}, {
                handlesStream : true
            });
        }).toThrowError("A stream handler should be of object type.");
    });

    it('should create handler from an object to run in parallel', (done) => {
        const handler = {
            handle : (a) => { done(); return a;}
        };
        const appHandler = new Handler("valid",handler, {
            inParallel : true
        } );

        appHandler.handle(56);
        expect(appHandler.handlesStream).toEqual(undefined);
        expect(appHandler.inParallel).toEqual(true);
    });

})