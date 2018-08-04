# Logs

Muneem framework let the users decide what framework they need for logging.

```js
const logger = new MyLogger();

const muneem = new Muneem();
muneem.setLogger(logger); //to enable framework logging 

logger.info();
Muneem.logger.info();
answer.logger.info(); //when used 
```

Please note that a logger should have following methods;

* info
* debug
* error
* warn

