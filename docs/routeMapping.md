# Route Mapping

```yaml
- route: 
    uri: sample/uri
    when: POST #["POST" , "PUT"]
    to: main
    after: [ pre, handlers ]
    then: [ post, handlers ]
    in: envName
  

```