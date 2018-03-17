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

})