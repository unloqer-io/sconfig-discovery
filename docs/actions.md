
## config.get
##### Aliases 
> - GET /config

##### Authorization 
 - registry.token



## config.set
##### Aliases 
> - POST /config

##### Authorization 
 - registry.token



## home
##### Aliases 
> - GET /


## ping
##### Aliases 
> - GET /ping


## registry.announce
##### Aliases 
> - POST /announce

##### Input 
 - **type** *(required)*  `String`
 - **name**  `String, default null`
 - **host** *(required)*  `String`
 - **proto**  `Enum, default http`
 - **timeout**  `Number, default null`
 - **port** *(required)*  `Number`
 - **path**  `String, default `
 - **tags**  `Array, default []`
 - **ttl**  `Number, default 30`
 - **version**  `Number, default null`

##### Authorization 
 - registry.token



## registry.get
##### Aliases 
> - GET /registry

##### Input 
 - **type**  `String, default null`
 - **tags**  `Array, default null`

##### Authorization 
 - registry.token


##### Middleware 
 - registry.saveChanges



## registry.leave
##### Aliases 
> - POST /leave

##### Input 
 - **sid** *(required)*  `String`

##### Authorization 
 - registry.token


