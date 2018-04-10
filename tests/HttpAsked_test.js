const fs = require('fs');
const path = require('path');
const eventEmitter = require('events').EventEmitter;
const HttpAsked = require("../src/HttpAsked")
const MockReq = require('mock-req');
const ApplicationSetupError = require("../src/ApplicationSetupError")

describe ('HttpAsked', () => {

    //TODO: make it the part of anumargak
    it('should separate query params', () => {
        const request = new MockReq({
            url: "/someurl/?query=param"
        });

        const asked = new HttpAsked(request);

        //then
        expect(asked.url).toEqual("/someurl/");
        expect(asked.query).toEqual({ query : 'param'});
    });

    it('should set constructor parameters', () => {
        const request = new MockReq({
            url: "/someurl"
        });

        const asked = new HttpAsked(request,{param: 'val'},{ context : 'val'});

        //then
        expect(asked.url).toEqual("/someurl");
        expect(asked.params).toEqual({ param : 'val'});
        expect(asked.context).toEqual({ context : 'val'});
    });

    it('should headers', () => {
        const request = new MockReq({
            url: "/someurl",
            headers: {
                "header1" : "val1",
                "header2" : "val2"
            }
        });

        const asked = new HttpAsked(request,{param: 'val'},{ context : 'val'});

        //then
        expect(asked.headers).toEqual({
            "header1" : "val1",
            "header2" : "val2"
        });
    });
});