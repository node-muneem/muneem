# Route Mapping

You can define the route mapping in a separate yaml file (recommend) as they are easy to read, understand, and manage.

Please check [अनुमार्गक (anumargak)](https://github.com/node-muneem/anumargak) for more detail about url syntax.

```yaml
- route: 
    url: /this/is/the/url
    when: ["POST", "PUT"] #default: GET
    to: serviceName
    after: [ authentication , cache-out ]
    then: [ cache-in , compress ]
    in: dev #environment
    maxLength: 1250
```

```JavaScript
const app = Muneem({
    mappings : "path/for/routes/mappings",
}).start();
```

You can also add routes from the code.

```JavaScript
const app = Muneem();
//Add request handlers
app.addHandler("paymentService", (asked, answer, giveMe) => {
    answer.write("I'm a fake service");
});
//Add route
app.route({
    url: "/this/is/the/url",
    when: ["POST", "PUT"], //default: GET
    to: "paymentService",
    after: [ "authentication" , "cache-out" ],
    then: [ "cache-in" , "compress" ],
    in: "dev" //environment
})
app.start();
```

serviceName, authentication , cache-out, cache-in , and compress in above mappings are the name of request handlers. They can be registered with some name and that name can be used as a reference in route mapping. You can also map a handler without registering it. 

```JavaScript
const app = Muneem();
var paymentService = (asked, answer, giveMe) => {
    answer.write("I'm a fake service");
}
app.route({
    url: "/this/is/the/url",
    when: ["POST", "PUT"], //default: GET
    to: paymentService,
    after: [ "authentication" , "cache-out" ],
    then: [ "cache-in" , "compress" ],
    in: "dev" //environment
})
app.start();
```

You can also pass an array of routes. Eg

```JavaScript
app.route([{
    url : "/logout",
    to : logoutHandler,
},{
    url : "/login",
    to : loginHandler,
},{
    url : "/public/url",
    to : publicPageProvider,
},{
    url : "/private/url",
    to : privatePageProvider,
    after: authentication
}]);
```
Please note that a request handler should bre registered before registering a route. A [request handler](Handler.md) can be added either through code or from file system.