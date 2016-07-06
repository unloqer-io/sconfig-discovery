
## admin.namespace.create

##### Aliases 
> - POST /admin/namespace

##### Input 
 - **name** *(required)*  `alpha`

##### Authorization 
 - admin.token



## admin.namespace.delete

##### Aliases 
> - DELETE /admin/namespace

##### Input 
 - **name** *(required)*  `alpha`

##### Authorization 
 - admin.token



## admin.service_key.reset

##### Aliases 
> - POST /admin/service-key/reset

##### Input 
 - **token** *(required)*  `string`

##### Authorization 
 - admin.token



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
 - **type** *(required)*  `string`
 - **name**  `string`
 - **host** *(required)*  `string`
 - **proto**  `enum(http, https), default http`
 - **port** *(required)*  `number`
 - **path**  `string`
 - **tags**  `array, default `
 - **ttl**  `number, default 30`

##### Authorization 
 - registry.token



## registry.get

##### Aliases 
> - GET /registry

##### Input 
 - **type**  `string`
 - **tags**  `array`

##### Authorization 
 - registry.token



## registry.leave

##### Aliases 
> - POST /leave

##### Input 
 - **sid** *(required)*  `string`

##### Authorization 
 - registry.token


