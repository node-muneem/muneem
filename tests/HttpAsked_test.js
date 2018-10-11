const fs = require('fs');
const path = require('path');
const eventEmitter = require('events').EventEmitter;
const HttpAsked = require("../src/HttpAsked")
const MockReq = require('mock-req');
const ApplicationSetupError = require("../src/ApplicationSetupError")

describe ('HttpAsked', () => {

    it('should set headers', () => {
        const request = new MockReq({
            url: "/someurl",
            headers: {
                "header1" : "val1",
                "header2" : "val2"
            }
        });

        const asked = new HttpAsked(request,{param: 'val'});

        //then
        expect(asked.headers).toEqual({
            "header1" : "val1",
            "header2" : "val2"
        });
    });
});