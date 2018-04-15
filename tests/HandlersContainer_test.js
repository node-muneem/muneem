const Container = require("../src/HandlersContainer");

describe ('HandlersContainer', () => {
    it('should add a function', () => {
        
        const map = new Container();
        map.add("test", () => 35);

        const handler = map.get("test");
        expect(handler()).toEqual(35);
    });

    it('should overwrite handler with same name', () => {
        
            const map = new Container();
            map.add("test", () => 35);
            map.add("test", () => 38);

            const handler = map.get("test");
            expect(handler()).toEqual(38);
    });

    it('should error when invalid handler is added', () => {
        
        const map = new Container();

        expect(() => {
            map.add("test", "() => 35");
        }).toThrowError("Handler should be a function or an object with 'handle' method");

    });

});