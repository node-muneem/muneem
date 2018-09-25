# Plugins



You can create a plugin which accepts Muneem instance and options. It can add methods to HttpAnswer class, and HttpAsked class which are nothing but the wrapper around native http request and response.

You can also register for an event. Check [the list of events](Events.md) supported by Muneem framework.

```JavaScript
export.modules = function(muneem, globalOptions){

    muneem.addToAnswer("newMethod", () => {});
    muneem.addToAsked("newMethod", () => {});
    //muneem.on("eventName", () => {});
    muneem.after("eventName", () => {});
    muneem.before("eventName", () => {});

}
```

Eg a plugin registered for "addRoute" event can read route specific configuration. Hence it can ask users to provide plugin specific options with route configuration.

```JavaScript
muneem.add("route", {
    //..
    plugin-options : {
        //..
    }
})
```

Now the user can use the plugin in following way;

```JavaScript
const muneem = Muneem();
const plugin = require("muneem-plugin");

muneem.use(plugin, options);
//plugin(muneem, options);

```