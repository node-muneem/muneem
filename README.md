# मुनीम (Muneem)
Simple and fast web framework designed not only for developers but QAs, Maintainers, BAs, and DevOps.

<img align="left" alt="Muneem Logo" src="./static/muneem.png" width="180px" />

मुनीम (Muneem) is the web framework developed in nodejs. It is designed with the aim of easy & rapid delopment, small learning curve, distributed development, fast services, proper documentation, easy bug discovery and providing the best solution not only for developers but all the team members.

> Your contribution will help us to grow fast


## Usages

**Install**

```bash
$ npm i muneem --save
```



**Example**

```js
const muneem = Muneem();

muneem.add(...);

muneem.start();
```

Muneem allows to add routes and request handlers from the code as well as from the file system. 

Routes added using yaml mapping files are redable can be understood and managed by non-developers;

```yaml
#Scenario: this is the sample route
- route: 
    uri: /some/url
    when: POST
    to: requestHandler
    after: [ "authentication", "monitoring", "cache out"]
    then: [ "compress it" , "cache in"]
```

Similarly request handlers added from filesystem hides the detail of framework configuration from the user. Eg

**profile.js**
```JavaScript
//@handler
var getProfileDetail = async (asked, answer, store) => {
    await asked.readXml();
    var profileDetail = store("db")( buildQuery(asked.body.profileId) );
    answer.writeXml(profileDetail);
}

//..

module.exports = getProfileDetail;
```

## Documentation
* [Introduction](https://github.com/node-muneem/muneem/blob/master/docs/Introduction.md): registering routes, adding resources to store, server configuration, https, http2, limiting request length.
* [Routes](https://github.com/node-muneem/muneem/blob/master/docs/routeMapping.md): request mapping with request-handlers, sequence of handlers, environment specific routes, unnamed handlers, limiting request length etc.
* [Request Handler](https://github.com/node-muneem/muneem/blob/master/docs/Handler.md): Adding handlers from code, and from files.
    * [HttpAsked](https://github.com/node-muneem/muneem/blob/master/docs/HttpAsked.md): A wrapper around native http request object.
    * [HttpAnswer](https://github.com/node-muneem/muneem/blob/master/docs/HttpAnswer.md): A wrapper around native http response object.
* [Events](https://github.com/node-muneem/muneem/blob/master/docs/Events.md): Adding before/after events, and pre/post handlers, Handling errors, default routs, and large requests using events.
* [Writing Middleware or Plugins](https://github.com/node-muneem/muneem/blob/master/docs/Plugins.md): How a plugin can be written. What are the things can be done by a plugin.
* [Available Plugins](https://github.com/node-muneem/muneem/blob/master/docs/AvailablePlugins.md): body parsers, serializers, compression etc.