# Request Handler

A request handler can be added from file system or from code;

```JavaScript
const app = Muneem({
    handlers : "path/for/request/handlers",
})
app.add("handler", "name", fn);
//app.addHandler("name", fn);

 app.start();
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

A handler added from the file system should have `//@handler`, which helps to differentiate other code from request handlers

```JavaScript
//@handler   

//.. some code 

module.exports = (asked,answer) => {
    //..
}
```