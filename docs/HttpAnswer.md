# HttpAnswer

HttpAnswer is the wrapper on original HTTP response instance. This is passed as 2nd parameter to any request handler.

## Properties

**encoding** : Default is "utf8"

## Methods

**type** : set Content-Type

```js
answer.type("application/json");
```

**length** : set Content-Length

```js
answer.length(35);//in bytes
```

**getHeader** : get header parameter value. Header name is case insensitive.

```js
answer.getHeader("header-name");
```

**setHeader** : set header parameter value. Header name is case insensitive and overwrite privious value. However for header `set-cookie` this function put the values in an array instead of overriding previous value.

```js
answer.setHeader("header-name", value);
```

**removeHeader** : remove header parameter. Header name is case insensitive.

```js
answer.removeHeader("header-name");
```

**answered** : return true if the request is already answered.

```js
answer.answered();
```

**status** : Set status code.

```js
answer.status(200);
```

**write** : write data to response.

```js
//answer.write(data [,type [,length] ]);
answer.write("I'm fine.", "plain/text", 9);
answer.end();
```

**writeMore** : Add more string data to previously added data. Or pipe the stream to previously added stream. Or set data if it was not set before.

```js
answer.writeMore("I'm fine.");
answer.writeMore("How are you?");
answer.end();
```

**replace** : Overwrite previously added data to response.

```js
//answer.replace(data [,type [,length] ]);
answer.replace("I'm fine.", "plain/text", 9);
answer.end();
```

**end** : End the response stream, serialize data if need to be, compress the data if need to be, then answer the client.

Specifying the reason may helpful when client is answered abnormally due to the error, invalid input, server issue etc. It helps in error reporting, logging

```js
//answer.replace(type ,length [, reason]);
//answer.replace(code [, reason]);
//answer.replace([ reason]);
answer.end();
```

**redirectTo** : Redirect the current request to given location with 302 status code.

```js
answer.redirectTo(location);
```