# Introduction

## Methods

* **add** : To add a request handler, compressor, serializer, or route.
* **start** : start the server

## Example

When you load handlers from a directory and routes from a mapping file

```js
const muneem = Muneem({
    handlers : "path/of/handlers/directory",
    mappings : "path/of/mappings/file_or_directory",
});

muneem.after("event", fn);//muneem.on("type", fn);
muneem.before("event", fn);

//Start with server configuration
muneem.start();

```

When you add everything by code 

```js
//Create muneem instance with necessary configuration
const muneem = Muneem({
    //compress : true,
    maxLength: 1e6
});

//Add handlers (better to save them as separate modules)
muneem.add("handler", handler, "name");//muneem.addHandler("name", handler) ;

//Add serializers (Muneem can handle json, and plain text by default)
muneem.add("Serializer", handler, "type");//muneem.addSerializer("type", handler);

//Add compressors (Muneem can handle gzip and inflate by default)
muneem.add("Compressor", handler, "type");//muneem.addCompressor("type", handler);
muneem.add("Compressor", handler, "type", true);//muneem.addCompressor("type", handler, true);


//Add routes
muneem.add("route", routeObject); //muneem.route(routeObject);

muneem.after("event", fn);//muneem.on("type", fn);
muneem.before("event", fn);

//Start the server
muneem.start()
```

### Handler type

Case insensitive.

* request ( direct method : addHandler("name", fn) )
* route ( direct method : route() )
* serializer ( direct method : addSerializer("conteny-type", fn) )
* compressor ( direct method : addCompressor("compression-technique", fn) )
* stream-compressor ( direct method : addCompressor("compression-technique", fn, true) )

### Events

Case insensitive. 

#### Before and After

* pre | preHandler : Before/After any pre handler
* post | postHandler : Before/After any post handler
* each | eachHandler : Before/After any handler
* main | mainHandler : Before/After main handler

#### Before

 * addRoute : just before the route is added; args: route context
 * serverStart, start : just before server starts; 
 * serialize : before Serialization happens
 * compress : before Compression happens
 * send, answer, response : Before sending the response
 * serverClose, close : just before server's close is triggered

#### After

 * addRoute : just after the route is added; args: route context
 * serverStart, start : just after server starts; 
 * request : before route; raw request, raw response
 * route : before all handlers; asked, answer
 * exceedContentLengthn, fatBody; asked, answer
 * serialize : before Serialization happens; asked, answer
 * compress : before Compression happens; asked, answer
 * send, answer, response : After sending the response; asked, answer, isStream
 * serverclose, close : just before server's close is triggered
 * routeNotFound : when no matching route is found
 * error : on error


**Magic Tip**

> * You can automatically add handlers, serializers, and compressors from specified path.
> * You can automatically add routes from routes mapping yaml file.

### Muneem configuration 

```js
const muneem = new Muneem({
    compress : compressionOptions, // or true/false
    handlers : "path/of/handlers/directory", //or an array
    mappings : "path/of/mappings/file_or_directory", //or an array
    server : {
        host : "localhost", //default : 0.0.0.0
        port : 3377, //default : 3002
        http2 : false, //default : false
        generateUniqueReqId : false, //default : false
        https : httpsOptions,
        maxHeadersCount : 5
    }
})
```

### asked.context

```js
{
    route : {
        uri : "sample/uri", 
        when : "POST", 
        to : main, 
        after : [ pre, handlers ], 
        then : [ post, handlers ], 
        in : "envName"
    },
    app : {
        http2 : false,
        https: true,
        //alwaysReadRequestPayload: false,
        compress : compressionOptions,
        maxLength: 1e6
    }
}
```

## Other

**Body Parsers**: You may need body parsers to transform request body to JS object or your desirable format. For this;

1. Write a pre handler which read request body and parse it in your desire format and set it to `asked.data`.
2. Use Muneem plugins which add conveynient methods to asked object: readBody, readJson readPlainText, readNimn.
