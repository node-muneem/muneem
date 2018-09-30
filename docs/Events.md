# Events

You can add events callback in following ways

```JavaScript
const muneem = Muneem();

muneem.after("event", fn);//muneem.on("type", fn);
muneem.before("event", fn);

muneem.start();
```

Event name is case insensitive and multiple aliases ara available for your comfortability.

## Before and After

* pre, or preHandler : Before/After any pre handler

```JavaScript
muneem.after("pre", (asked, handlerName) => {
    //..
})
```

* post, or postHandler : Before/After any post handler

```JavaScript
muneem.after("post", (asked, handlerName) => {
    //..
})
```
* each, or eachHandler : Before/After pre & post handlers

```JavaScript
muneem.after("each", (asked, handlerName) => {
    //..
})
```
* main, or mainHandler : Before/After main handler
```JavaScript
muneem.after("main", (asked, handlerName) => {
    //..
})
```

## Before

 * addRoute : just before the route is added;

 ```JavaScript
muneem.before("addRoute", ( routeContext ) => {
    //..
})
```

 * serverStart, or start : just before server starts; 
 ```JavaScript
 /*
serverOptions : {
    host : "local.host",
    port: 3002,
    http2 : false,
    https : false
}
*/
muneem.before("start", ( serverOptions ) => {
    //..
})
```

 * send, answer, or response : Before sending the response

```JavaScript
muneem.before("send", ( asked, answer ) => {
    //..
})
```

 * serverClose, or close : just before server's close is triggered

```JavaScript
muneem.before("serverClose", ( ) => {
    //..
})
```

## After

* serverStart, start : just after server starts; 
  ```JavaScript
muneem.after("start", ( ) => {
    //..
})
```
* request : before route;
 ```JavaScript
muneem.after("request", ( nativeRequest, nativeResponse ) => {
    //..
})
```

* route : before all handlers;
```JavaScript
muneem.after("serverClose", (  asked, answer ) => {
    //..
})
```

* exceedContentLengthn, or fatBody: this event is triggered when the request stream is more than expected.
```JavaScript
muneem.after("fatBody", (asked ) => {
    //..
})
```

* send, answer, or response : After sending the response;
```JavaScript
muneem.after("send", ( asked ) => {
    //..
})
```

* serverclose, or close : just before server's close is triggered
```JavaScript
muneem.after("serverClose", ( ) => {
    //..
})
```

* routeNotFound : when no matching route is found
```JavaScript
muneem.after("routeNotFound", ( asked ) => {
    //..
})
```

* error : on error
```JavaScript
muneem.after("error", ( error, asked ) => {
    //..
})
```