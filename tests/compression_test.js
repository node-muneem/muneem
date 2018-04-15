const MockReq = require('mock-req');
const MockRes = require('mock-res');
const HttpAnswer = require("../src/HttpAnswer")
const gzipCompressor = require("../src/defaultHandlers/compressors/gzip")
const gzipStreamCompressor = require("../src/defaultHandlers/compressors/gzipStream")
const deflatCompressor = require("../src/defaultHandlers/compressors/deflat")
const deflatStreamCompressor = require("../src/defaultHandlers/compressors/deflatStream")
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

describe ('Compressor', () => {

    it('should gzip response data', () => {
        const answer = new HttpAnswer(new MockRes());
        answer.data = "sample data to be compressed";

        gzipCompressor(null,answer);

        expect(answer.data.toString()).not.toEqual("sample data to be compressed");
        expect(zlib.gunzipSync(answer.data).toString()).toEqual("sample data to be compressed");
    });

    it('should deflat response data', () => {
        const answer = new HttpAnswer(new MockRes());
        answer.data = "sample data to be compressed";

        deflatCompressor(null,answer);

        expect(answer.data.toString()).not.toEqual("sample data to be compressed");
        expect(zlib.inflateSync(answer.data).toString()).toEqual("sample data to be compressed");
    });

    it('should gzip response stream', (done) => {
        
        const res = new MockRes();
        const answer = new HttpAnswer(res);
        
        //create a file to test
        fs.writeFileSync(path.resolve(__dirname, "fileToDownload"), "This file is ready for download");

        const filePath = path.resolve(__dirname, "fileToDownload");
        const readStream = fs.createReadStream(filePath);
        
        let chunks = [];
        answer.write(readStream);
        gzipStreamCompressor(null,answer);

        answer.data.on('data', (chunk) => {
            chunks.push(chunk);
        });
        answer.data.on('end', () => {
            chunks = Buffer.concat(chunks);
            expect(chunks.toString()).not.toEqual("This file is ready for download");
            expect(zlib.gunzipSync(chunks).toString()).toEqual("This file is ready for download");
            done();
        });

        readStream._read(50); 
    });

    it('should deflat response stream', (done) => {
        
        const res = new MockRes();
        const answer = new HttpAnswer(res);
        
        //create a file to test
        fs.writeFileSync(path.resolve(__dirname, "fileToDownload"), "This file is ready for download");

        const filePath = path.resolve(__dirname, "fileToDownload");
        const readStream = fs.createReadStream(filePath);
        
        let chunks = [];
        answer.write(readStream);
        deflatStreamCompressor(null,answer);

        answer.data.on('data', (chunk) => {
            chunks.push(chunk);
        });
        answer.data.on('end', () => {
            chunks = Buffer.concat(chunks);
            expect(chunks.toString()).not.toEqual("This file is ready for download");
            expect(zlib.inflateSync(chunks).toString()).toEqual("This file is ready for download");
            done();
        });

        readStream._read(50); 
    });
});