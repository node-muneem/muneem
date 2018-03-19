const HandlersMap = require("../../src/HandlersMap");

describe ('HandlersMap', () => {
    it('should add a handler with default type', () => {
        
        const map = new HandlersMap();
        map.add("test", () => 35, {
            inParallel : false
        });

        const handler = map.get("test");

        expect(handler.handle()).toEqual(35);
        expect(handler.inParallel).toEqual(false);
        expect(handler.type).toEqual("requestData");

    });

    it('should add a handler to handle request data stream', () => {
        
        const map = new HandlersMap();
        map.add("test", () => 35, {
            inParallel : false
        }).toHandle("requestDataStream");

        const handler = map.get("test");

        expect(handler.handle()).toEqual(35);
        expect(handler.inParallel).toEqual(false);
        expect(handler.type).toEqual("requestDataStream");

    });

    it('should error when asked to handle invalid type', () => {
        
        expect(() => {
            const map = new HandlersMap();
            map.add("test", () => 35, {
                inParallel : false
            }).toHandle("abcd");
        }).toThrowError("Invalid type abcd");

    });

    it('should not add a handler with same name', () => {
        
        expect(() => {
            const map = new HandlersMap();
            map.add("test", () => 35);
            map.add("test", () => 38);
        }).toThrowError("You've already added a handler with same name test");
    });

});