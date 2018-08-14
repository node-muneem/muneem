# Plugins

You may use events call backs and `addToAnswer` and `addToAsked` methods to write Muneem's plugins.

```JavaScript
const muneem = Muneem();
const middleware = require("muneem-mw");

muneem.use(middleware);
//middleware(muneem);
```

## Warning
 
 What information a event callback can collect?

 As you passes the instance of muneem, a plugin may know the location of handlers, and mapping file. It may register for an event call back which may collect route related information.