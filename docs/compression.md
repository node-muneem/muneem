# Compression
Compression is by default applied to all the routes if accept encoding header is set. You can enable / disable it globally or for particular route by setting `compress` property.

```js
const server = Muneem({
    compress : false
})

server.addRoute({
    uri: "/someuri",
    compress: true
})
```
when you use mapping file

```yaml
- route:
    uri: /someuri
    compress: true
```

Muneem currently supports `gzip`, and `deflate` with default options. You can register your own compressor to change default configuration like: level, memLevel, strategy etc. You can also override or add compression handler.

```js
server.addCompresser("br",handler);
server.addStreamCompresser("br",streamHandler);

function handler(asked,answer){
    answer.replace( compress( answer.data ).by( "br" ) );
}
```

### Filter
Muneem doesn't compress when there is invalid, undefined, or unknown compression type is given. Or when `x-no-compression` or `Cache-Control: no-transform` request headers are set. Or if given threshold is not met. You can override this restriction by setting *compress.filter* property.

```js
const server = Muneem({
    compress: {
        //preference: "gzip",
        //threshold  : 2048,
        filter: (asked,answer) => {
            if(asked.headers['dont-compress']){
                return false;
            }else{
                return true;
            }
        }
    }
})
```
TODO:
    // Don't compress for Cache-Control: no-transform
    // https://tools.ietf.org/html/rfc7234#section-5.2.2.4


As the client can pass multiple type of comparision in `accept-encoding` header. Muneem call the compressor with maximum priority

```
// Multiple algorithms, weighted with the quality value syntax:
Accept-Encoding: deflate, gzip;q=1.0, *;q=0.5
```

However, you can set your choice to force Muneem to use particular compression technique if given in header.

```yaml
- route:
    uri: /someuri
    compress: [ "gzip" ]

- route:
    uri: /anotheruri
    compress: [ "gzip", "deflate"]
```

In above scenario, if `accept-encoding` header doesn't contain compression technique set by usser then
* if no compression technique is registered, Muneem will not apply any compression technique. (will log warning)
* if compression techiniques are registered then Muneem apply the technique with highest priority.

If accept-encoding header is set to "*", gzip compression will be applied as it is most common. However you can override it;

```js
server.addCompresser("*",defaultCompresser);
```


## Do we need to disable compression?

There are multiple type of data representation (Like XML, JSON, msgpack, [Nimn](http://nimn.in/) etc. ) and compression (Like gzip, deflate, br etc.) techniques available. If there is not much difference in uncompressed and compressed data, then you should avoid compression as it'll engage CPU and memory without much benifit. Here is some comparison.

JSON :  551
JSON + gzip:  294
JSON + deflate:  282

Msgpack :  420
Msgpack + gzip:  291
Msgpack + deflate:  279

Nimn :  190
Nimn + gzip:  165
Nimn + deflate:  153

In above comparision, there is no difference when you send compressed JSON or compressed msgpack. And definetely there is no benifit of sending uncopressed data. But if you are using निम्न (Nimn) data format, it is alreay smaller than compressed JSON or msgpack hence you may avoid compression.

