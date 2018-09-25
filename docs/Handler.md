# Request Handler

A request handler can be added from file system or from code;

```JavaScript
const muneem = Muneem({
    handlers : "path/for/request/handlers",
})
muneem.add("handler", "name", fn);
//muneem.addHandler("name", fn);

 muneem.start();
```

A handler accepts 3 arguments: [HttpAsked](HttpAsked.md), [HttpAnswer](HttpAnswer.md), Store.

A store is the collection of shared resources which can be added as `app.addToStore("name", resource)`.

```JavaScript
module.exports = async (asked, answer, giveMe) => {
    const data = await asked.readJson();//read request data
    var db = giveMe("mongo"); //shared resources
    //..
    anwser.writeJson( data );//response back
}
```