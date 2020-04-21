> NOTE: saving this file only for the idea but the extension system changed 100% since the integration  

### Note for when extensions is a thing:
For comms, make the module register a function in `globals.intercomBus`? Then send it like:
```javascript
globals.intercomBus['txAdminClient'] = {
    resourcesList: this.handleResourcesList.bind(this)
}
```  
And txAdminClient would post the data to `/intercom/txAdminClient` with `resourcesList` as a parameter so the intercom endpoint would know where to send this info.  
  
For now I will use `globals.intercomTempResList`


-----

Actually probably better just to have the intercom call a method inside the extension object.  
Something like `globals.exts[extName].intercomHandler(req, res)`.
In this case its not only easier for the data being stored (no bus, if someone wants a data from an ext, call their methos to retrieve it), but also the handler can give the resource an http response other than "okay".
