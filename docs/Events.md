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
* post, or postHandler : Before/After any post handler
* each, or eachHandler : Before/After any handler
* main, or mainHandler : Before/After main handler

## Before

 * addRoute : just before the route is added; args: route context
 * serverStart, or start : just before server starts; 
 * send, answer, or response : Before sending the response
 * serverClose, or close : just before server's close is triggered

## After

 * addRoute : just after the route is added; args: route context
 * serverStart, start : just after server starts; 
 * request : before route; raw request, raw response
 * route : before all handlers; asked, answer
 * exceedContentLengthn, or fatBody; asked, answer
 * send, answer, or response : After sending the response; asked, answer, isStream
 * serverclose, or close : just before server's close is triggered
 * routeNotFound : when no matching route is found
 * error : on error

 