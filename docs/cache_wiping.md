### Cache Wiping  
This feature was requested many times and in the end we decided against putting it into FXAdmin for the following reasons:
- Its just not necessary with the newest builds of FiveM anymore.
- It can be dangerous considering that not configuring it correctly might end up recursively wiping out important files.  

More info: https://forum.fivem.net/t/why-people-delete-the-server-cache-folder/573851  

### If you really insist...
If for some reason you really need to do wipe the cache, do `npm install del` and add the follow code to the begining of the `spawnServer()` method in `src/components/fxRunner.js`:

```javascript
//Wiping cache
let cachePath = `${this.config.basePath}/cache/files/*`;
try {
    log('Wiping FXServer cache...', context)
    const deletedFiles = await del(cachePath, {force: true});
    log(`Deleted ${deletedFiles.length} files from ${cachePath}.`, context);
} catch (error) {
    logError(`Error while wiping cache: ${error.message}`, context);
    if(globals.config.verbose) dir(error);
}
```
  
Note: you might need to adapt this code due to updates.  
Note2: not tested on Linux
