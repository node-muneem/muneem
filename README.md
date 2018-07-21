# मुनीम (Muneem)
Simple and fast web framework designed not only for developers but QAs, Maintainers, BAs, and DevOps.

<img align="left" alt="Muneem Logo" src="./static/muneem.png" width="180px" />

मुनीम (Muneem) is the web framework developed in nodejs. It is designed with the aim of easy & rapid delopment, small learning curve, distributed development, fast services, proper documentation, easy bug discovery and providing the best solution not only for developers but all the team members.

> Your contribution will be appreciated.

## Aim
* Distributed Development
* Small Learning curve
* Fast fault detection
* Rich documentation APIs
* Security
* Friendly for all the project members

## Usages
Muneem can be used in multiple ways. Here is the quick overview. Please read the full [documentation](https://github.com/muneem4node/muneem/tree/master/docs) or watch video tutorials for complete detail.

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

Routes can be added either from code or by mapping file;

```yaml
- route: 
    uri: /some/url
    when: POST
    to: serviceHandler
    after: [ "authentication", "monitoring", "cache out"]
    then: [ "compress it" , "cache in"]
```
