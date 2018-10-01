# HttpAnswer

HttpAnswer is the wrapper on original HTTP response instance. This is passed as 2nd parameter to any request handler.

## Properties

**encoding** : Default is "utf-8"

## Methods

**type** : set Content-Type

```js
answer.type("application/json");
var contentType = answer.type();
```

**length** : set Content-Length

```js
answer.length(35);//in bytes
var contentLength = answer.length();
```

**getHeader** : get header parameter value. Header name is case insensitive.

```js
answer.getHeader("header-name");
```

**cookie** : Set cookie header value. The value should be serialized with all attributes, like path, domain, expiry time etc. 

```js
answer.cookie("sessionToken=abc123; Expires=Wed, 09 Jun 2021 10:18:14 GMT");
```

You can use some external library for serialization. Eg

```js
var cookie = require('cookie');

muneem.add("handler", (asked, answer) => {
    //..
    answer.cookie( cookie.serialize(name, val, attributes) );
});
```

**setHeader** : set header parameter value. Header name is case insensitive and overwrite privious value.

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
//answer.write(data [,type [,length [, safe ] ] ]);
answer.write("I'm fine.", "plain/text", 9);
answer.end();
```

**end** : End the response stream and finally send the data to client.

Once called all the remaining handlers and their pre/post handler event callbacks will be canceled.

```js
//answer.end(type ,length [, reason]);
//answer.end(code [, reason]);
//answer.end([ reason]);
answer.end();
```
Specifying the reason may helpful when client is answered abnormally due to the error, invalid input, server issue etc. It helps in error reporting, logging.


**close** : Lighter version of `end()`. Useful for non-200 responses. It doesn't invoke before/after answer event, it doesn't response with data.

Once called all the remaining handlers and their pre/post handler event callbacks will be canceled.

```js
//answer.close(code [, reason]);
answer.close(404);
```

Specifying the reason may helpful in error reporting, logging.

**skip** : Once called number of next handlers and their pre/post handler event callbacks will be skipped.

```js
//answer.close(code [, reason]);
answer.skip(2);
```

**redirectTo** : Redirect the current request to given location with 302 status code.

```js
answer.redirectTo(location);
```

**error** : This method invokes error handler.

```js
answer.error(new Error());
```

**resourceNotFound** : This method invokes route not found handler

```js
answer.resourceNotFound(new Error());
```

