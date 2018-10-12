# Introduction

Muneem is the web framework to write fast and simple web services and server.

You can use it in express style;

```JavaScript
const app = Muneem();

app.use(someMiddleware);
app.get("/". (req, res) => {});

app.start();
```

Or in it's own style;

```JavaScript
Muneem({
    handlers : "path/of/handlers/directory",
    mappings : "path/of/mappings/file_or_directory",
    maxLength : 1e6, //default 1e6
    requestId : false, //true, false, a function to generate unique request id
}).start({
    host : "localhost", //default : 0.0.0.0
    port : 3377, //default : 3002
    http2 : false, //default : false
    https : httpsOptions,
    maxHeadersCount : 5,
    //backlog: 511, //maximum length of the queue of pending connections
});

//app.start([port[, host[, backlog]]][, callback])
//app.start([options[, callback]])
```

* **requestId**: Set it to a function which generates unique id or true to take request arrival time as request id.
* **maxHeadersCount**: App will skip extra headers.
* **https**: node js standard https option for secure connection.
* **maxLength**: maximum request length

You can add routes, request handlers, resources and event callbacks. Route and handlers can be added from the code or from the filesystem.

### Store

If you need you can add shared resources to the store that you can access in request handlers;

```JavaScript
const app = new Muneem();

app.set("logger", logger);

app.get("/", (asked, answer, giveMe ) => {
    //..
    const logger = giveMe("logger");
    //..
})

app.start();
```

Default resources, you can find in store;

* **route context** : gives you route specific configuration. E.g.

```js
{
    uri : "sample/uri", 
    when : "POST", 
    to : main, 
    after : [ pre, handlers ], 
    then : [ post, handlers ], 
    in : "envName",
    maxLength: 1e6
}
```

* **app context** : gives you app specific configuration. E.g.
```js
{
    http2 : false,
    https: true,
    maxLength: 1e6,
    env: "dev", //process.env.NODE_ENV
}
```

### Default Handlers

#### Route not found handler
This handler is invoked when the requested route (combination of URL and method) is not registered.

```JavaScript
app.setRouteNotFoundHandler( (asked, answer) => {
    //..
} );
```

#### Error handler
This handler is invoked when an unexpected error is thrown.

```JavaScript
app.setErrorHandler( (err, asked, answer) => {
    //..
} );
```

#### Fat Body handler
This handler is invoked when request length is larger than defined length.

```JavaScript
const app = new Muneem({
    maxLength : 1e6 //default 1e6
})
app.setFatBodyHandler( (asked, answer) => {
    //..
} );
```

Maximum length can be specified at route level as well.