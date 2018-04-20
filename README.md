# मुनीम (Muneem)
A framework to write fast web services in easy way. Designed for developers, QAs, Maintainers, BAs, and DevOps.

<img align="left" alt="Muneem Logo" src="./static/muneem.png" width="180px" />

मुनीम (Muneem) is the web framework developed in nodejs. It is designed with the aim of easy & rapid delopment, small learning curve, distributed development, fast services, proper documentation, easy bug discovery and providing the best solution not only for developers but all the team members.

## Usages
Muneem can be used in multiple ways. Here is the quick overview. Please read the full documentation or watch video tutorials for complete detail.

**Install**

```bash
$ npm i muneem --save
```
**Example**

```js
const server = Muneem();

server.addHandler("auth", (request,response) => { \* some code*\ });
server.addHandler("profileService", async (request,response) => { \* some code*\ });
server.addHandler("cache",  (request,response) => { \* some code*\ });

server.route({
    uri : "/test",
    to : "profileService",
    adter : [ "auth", "cache" ]
    then : "cache"
})

server.start();
```

## Core features

* **High throughput** : Muneem is one of the fast node js frameworks. Visit performace project to know how much helpful it is for your project.
* **Extendable** : It is easy to develop plugins for Muneem. Check the list of [Pluings](docs/plugins)
* **Learning** : It is easy and fast to start with Muneem. Single api `addHandler` covers most of the cases. Read the documentation for more detail.

*Example*

```js
const server = Muneem();

server.addHandler("docs.pdf", (asked,answer) => {
    //create fileReadStream
    answer.write(fileReadStream);
});
```

* **Easy understanding** : Instead of registering routes (a route defines mapping between request URL and request handler) from the code, you can use `yaml` file which is easy to read and understand. Hence it is useful for the team members like, Business Analyst, Quality Analyst, DevOps, and Maintainers to understand the control flow without digging into the code or maintaining separate documentations.

*Example*

```yaml
- route: 
    uri: /some/url
    when: POST
    to: serviceHandler
    after: [ "authentication", "monitoring", "cache out"]
    then: [ "compress it" , "cache in"]
```
* **Documentation** : With the help of [muneem-docs]() plugin, you can easily check dynamic documents of your project.


## Performance

Speed is the top crieteria for many users to pick a framework. But in my opinion, it should be balanced with other features of the framework, coding style, support for 3rd party solutions, learning curve etc. Please read following articles if you also think speed is everything;

* 

Most of the developers calculate the performance (speed) of a framework with static URL returning `{"hello" : "world"}` response without considering network delay and other common processes like logging, monitoring etc. which is not realistic. I've created a separate [project]() which can help you to determine whether  मुनीम (Muneem) can provides you sifficient throughput.

