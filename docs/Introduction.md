# Introduction

Muneem is the web framework to write fast and simple web services and server.

```JavaScript
const muneem = Muneem({
    handlers : "path/of/handlers/directory",
    mappings : "path/of/mappings/file_or_directory",
}).start();
```

You can add routes, request handlers, resources and event callbacks. Route and handlers can be added from the code or from the filesystem.

### Muneem configuration 

```js
const muneem = new Muneem({
    handlers : "path/of/handlers/directory", //or an array
    mappings : "path/of/mappings/file_or_directory", //or an array
    server : {
        host : "localhost", //default : 0.0.0.0
        port : 3377, //default : 3002
        http2 : false, //default : false
        https : httpsOptions,
        requestId : false, //default : false
        maxHeadersCount : 5
    },
    maxLength : 1e6 //default 1e6
})
```

* **server.requestId**: Set it to a function which generates unique id or true to take request arrival time as request id.
* **server.maxHeadersCount**: App will skip extra headers.
* **server.https**: node js standard https option for secure connection.
* **maxLength**: maximum request length

### Store

If you need you can add shared resources to the store that you can access in request handlers;

```JavaScript
const muneem = new Muneem();

muneem.addToStore("logger", logger);

muneem.addHandler("paymentService", (asked, answer, giveMe ) => {
    //..
    const logger = giveMe("logger");
    //..
})
```