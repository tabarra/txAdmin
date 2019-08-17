### Note for when extensions is a thing:
For comms, make the module register a function in `globals.intercomBus`? Then send it like:
```javascript
globals.intercomBus['txAdminClient'] = {
    resourcesList: this.handleResourcesList.bind(this)
}
```  
And txAdminClient would post the data to `/intercom/txAdminClient` with `resourcesList` as a parameter so the intercom endpoint would know where to send this info.  
  
For now I will use `globals.intercomTempList`
