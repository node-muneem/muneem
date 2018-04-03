const fs = require('fs');
const path = require('path');
const eventEmitter = require('events').EventEmitter;
const HttpAsked = require("../src/HttpAsked")
const MockReq = require('mock-req');
const ApplicationSetupError = require("../src/ApplicationSetupError")

describe ('HttpAsked', () => {

    it('should return undefined when content length is 0', async () => {
        const request = new MockReq({
            headers : {
                "content-length" : 0
            }
        });
        const asked = new HttpAsked(request,undefined,{
            route: {
                maxLength : 20
            }
        });

        //when
        const data = await asked.readBody();

        //then
        expect(data).toEqual(undefined);
    });

    it('should return empty array when request has no body', async () => {
        const request = new MockReq();
        const asked = new HttpAsked(request,undefined,{
            route: {
                maxLength : 20
            }
        });
        asked._mayHaveBody = false;

        //when
        const data = await asked.readBody();

        //then
        expect(data).toEqual(undefined);
    });

    it('should return previously read body', async () => {
        const request = new MockReq({
            method: "POST"
        });
        const asked = new HttpAsked(request,undefined);
        request.write("this is request data");
        request.end();
        
        //when
        await asked.readBody();
        const data = await asked.readBody();

        //then
        expect(data.toString()).toEqual("this is request data");
    });

});