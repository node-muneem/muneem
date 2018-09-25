# Request Handler

A request handler can be added in 3 ways;

```JavaScript
const muneem = Muneem({
    handlers : "path/for/request/handlers",
})
muneem.add("handler", fn, "nameOfTheService");
muneem.addHandler("nameOfTheService", fn);

 muneem.start();
```

Handler example

```JavaScript
module.exports = (asked, answer, giveMe) => {
    const data = await asked.readJson();//read request data
    var db = giveMe("mongo"); //shared resources
    anwser.writeJson( db.get(data.query) );//response back
}
```