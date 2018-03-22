const Container = require("../../src/Container");

describe ('Container', () => {
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

});