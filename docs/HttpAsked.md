# HttpAsked

HttpAsked is the wrapper on original HTTP request instance. This is passed as first parameter to any request handler.

## Properties

**id** : An unique id which can be used to identify all the transactions in logs related to one request. This is by default not set until `requestId` property of server is set to `true` or set to a function to generate unique id.

**params** : This is not set in case of static URLs. Otherwise it is a map where all the properties are the name of the parameters. Check [Anumargak](https://github.com/node-muneem/anumargak) for more detail.

**headers** : Request header parameters map.

**cookies** : Muneem doesn't parse cookies by default. So you can acees them from the header to parse. 

```js
asked.headers.cookie;
```

You can use some external library for parsing or express middleware. Eg

```js
var cookie = require('cookie');

app.add("handler", "someName",  (asked, answer) => {
    asked.cookies = cookie.parse( asked.headers.cookie );
    console.log( asked.cookies["foo"] );
    //..
});
```

**queryStr** : complete unparsed query string 

**hashStr** : complete unparsed hash string 

**path**: URL without query string or hash string.

**_native** : Native request. You should avoid to use it, use *stream* instead.

**stream** : Metered request stream.

**contentLength** : The value of "content-length" header. Otherwise -1.

**body** : Request Body content. It'll be set to buffer when you call `readBody()` and request body is present. Otherwise it is an empty array.

```js
await asked.readBody();
var data = asked.data;
//var data = await asked.readBody()
```
