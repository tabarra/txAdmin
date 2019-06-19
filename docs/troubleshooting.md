# Troubleshooting

First and foremost check if you are using the most recent version of txAdmin and that you followed the installation instructions.


## Problems installing txAdmin  
If you ran into problems while executing the `npm i` command related to node-gyp/bcrypt/discord.js try downgrading to Node v10 LTS.  
If that doesn't work, try `npm i node-gyp` or `npm i --global --production windows-build-tools`.


## Problems running txAdmin  
When executing txAdmin, it might show you some errors. Example of an [error](https://i.imgur.com/2huiyBf.png), example of a [successful startup](https://i.imgur.com/QLCBZBm.png).

### [txAdmin:Authenticator] Unable to load admins.
If you haven't created the admins file yet, execute `npm run admin-add` to do so.  
- `cannot read file`: the admin file specified in your `server.json` could not be loaded. If you didn't changed the default (`data/admins.json`) make sure to create it based on the `admins-template.json` file inside your `data` folder.  
- `json parse error`: somehow you broke the file. Use [JSON Editor Online](https://jsoneditoronline.org) to validate and find the error. Also make sure you didn't used `\` instead of `/` in your configurations.
- `invalid data in the admins file`: You edited or removed the object keys (`name` and `password_hash`). Start again based on the `admins-template.json`.
- `invalid hash`: the `password_hash` must contain the hash of the password and not the password itself. To generate the hashed password, you can use tools like [this](https://www.browserling.com/tools/bcrypt) and [this](https://bcrypt-generator.com) or even [this one](https://passwordhashing.com/BCrypt). 
- `no entries`: you must have at least one admin.

### [txAdmin:Config Exporter] Unable to load configuration file 'data/server.json'
You haven't created the `server.json` file inside your `data` folder.  
Note1: If on Linux, make sure there is no permission issue (eg file owned by the root account).  
Note2: This also applies for any other server configuration file. Using `server.json` as an example since it's the default one.


## Problems running FXServer 
When you start txAdmin, your server will not start automatically (by default). Open the web panel and start txAdmin (actions > START Server). You can change this by enabling `fxRunner.autostart` on your server configuration file.  
If you are getting `HealthCheck request error` it means the txAdmin:Monitor could not connect to the FXServer. Check the two items below.
- If the server is actually online but txAdmin thinks it's offline, make sure your fxserver is configured to use the IP `0.0.0.0` in your `endpoint_add_*` directives instead of your public/private IP. Also check for your `global.fxServerPort` configuration, it must match the port configured in your `server.cfg`.
- If you are having trouble starting the FXServer via txAdmin, run `npm run config-tester server.json` and see which test is failing.  

<hr>

If this guide didn't help you, open an Issue or join our [Discord server](https://discord.gg/f3TsfvD).
