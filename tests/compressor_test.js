const MockReq = require('mock-req');
const Compressors = require("../src/Compressors")

describe ('Compressor', () => {
    it('should return no compressor when no header value', () => {
        const compressors = new Compressors();

        const request = new MockReq({
            headers : {}
        });

        //when
        const compressor = compressors.get(request);
        
        //then
        expect(compressor).toEqual(undefined);
    });

    it('should return no compressor when all types are unknown', () => {
        const compressors = new Compressors();

        compressors.add("gzip", () => 35);

        const request = new MockReq({
            headers : {
                "accept-encoding" : "br, deflat"
            }
        });

        //when
        const compressor = compressors.get(request);
        
        //then
        expect(compressor).toEqual(undefined);
    });

    it('should return no compressor when unknown compression type', () => {
        const compressors = new Compressors();

        compressors.add("gzip", () => 35);

        const request = new MockReq({
            headers : {
                "accept-encoding" : "deflat"
            }
        });

        //when
        const compressor = compressors.get(request);
        
        //then
        expect(compressor).toEqual(undefined);
    });

    it('should return known compressor', () => {
        const compressors = new Compressors();

        compressors.add("gzip", () => 35);
        compressors.add("*", () => 38);

        const request = new MockReq({
            headers : {
                "accept-encoding" : "deflat, br, gzip, *"
            }
        });

        //when
        const compressor = compressors.get(request);
        
        //then
        expect(compressor()).toEqual(35);
    });

    it('should return default compressor when header value is *', () => {
        const compressors = new Compressors();

        compressors.add("gzip", () => 35);
        compressors.add("*", () => 38);

        const request = new MockReq({
            headers : {
                "accept-encoding" : "*"
            }
        });

        //when
        const compressor = compressors.get(request);
        
        //then
        expect(compressor()).toEqual(38);
    });

    it('should return default compressor when rest compression types are unknown', () => {
        const compressors = new Compressors();

        compressors.add("gzip", () => 35);
        compressors.add("*", () => 38);

        const request = new MockReq({
            headers : {
                "accept-encoding" : "br, deflat, *"
            }
        });

        //when
        const compressor = compressors.get(request);
        
        //then
        expect(compressor()).toEqual(38);
    });

    it('should return compressor with high weightage when multiple compression types are supported', () => {
        const compressors = new Compressors();

        compressors.add("gzip", () => 35);
        compressors.add("deflat", () => 38);

        const request = new MockReq({
            headers : {
                "accept-encoding" : "br, deflat, gzip"
            }
        });

        //when
        const compressor = compressors.get(request);
        
        //then
        expect(compressor()).toEqual(38);
    });

    it('should return compressor with high weightage in the order of given preferences', () => {
        const compressors = new Compressors();

        compressors.add("gzip", () => 35);
        compressors.add("deflat", () => 38);

        const request = new MockReq({
            headers : {
                "accept-encoding" : "br, deflat, gzip"
            }
        });

        //when
        const compressor = compressors.get(request,[ "gzip", "deflat"]);
        
        //then
        expect(compressor()).toEqual(35);
    });

    it('should return compressor with high weightage from the single preference', () => {
        const compressors = new Compressors();

        compressors.add("gzip", () => 35);
        compressors.add("deflat", () => 38);

        const request = new MockReq({
            headers : {
                "accept-encoding" : "br, deflat, gzip"
            }
        });

        //when
        const compressor = compressors.get(request,["gzip"]);
        
        //then
        expect(compressor()).toEqual(35);
    });

    it('should return no compressor when preferred compression type is not in header value but registered', () => {
        const compressors = new Compressors();

        compressors.add("gzip", () => 35);
        compressors.add("deflat", () => 38);

        const request = new MockReq({
            headers : {
                "accept-encoding" : "br, gzip"
            }
        });

        //when
        const compressor = compressors.get(request,["deflat"]);
        
        //then
        expect(compressor).toEqual(undefined);
    });
});