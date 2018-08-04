# HttpAsked

HttpAsked is the wrapper on original HTTP request instance. This is passed as first parameter to any request handler.

## Properties

**id** : An unique id which can be used to identify all the transactions in logs related to one request. This is by default not set until `generateUniqueReqId` property of server is set to `true`.

**params** : This is not set in case of static URLs. Otherwise it is a map where all the properties are the name of the parameters. Check [Anumargak](https://github.com/NaturalIntelligence/anumargak) for more detail.

**headers** : Request header parameters map.

**query** : Query parameters map.

**_native** : Native request, in case you need to process it.

**stream** : Request Body stream

**data** : Request Body content. It'll be set when you call `readBody` method.

```js
await asked.readBody();
var data = asked.data;
//var data = await asked.readBody()
```

**context** : It contains route mappig and route specific app configuration.

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
        maxLength: 1e6
    }
}
```