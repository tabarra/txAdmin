# Troubleshooting

First and foremost check if you are using the most recent version of txAdmin and that you followed the installation instructions.

## Problems running txAdmin  
When executing txAdmin, it might show you some errors. Example of an [error](https://i.imgur.com/2huiyBf.png), example of a [successful startup](https://i.imgur.com/QLCBZBm.png).

### [txAdmin:Authenticator] Unable to load admins.
If you haven't created the admins file yet, execute `node src/scripts/admin-add.js` to do so.  
- `cannot read file`: the admin file `data/admins.json` could not be found.
- `json parse error`: somehow you broke the file. Use [JSON Editor Online](https://jsoneditoronline.org) to validate and find the error. Also make sure you didn't used `\` instead of `/`. You can either fix the issue, or run the admin-add script again to create a new file.
- `invalid data in the admins file`: You edited or removed the object keys (`name`, `password_hash` and `permissions`). You can either fix the issue, or run the admin-add script again to create a new file.
- `invalid hash`: the `password_hash` must contain the hash of the password and not the password itself. To generate the hashed password, you can use tools like [this](https://www.browserling.com/tools/bcrypt) and [this](https://bcrypt-generator.com) or even [this one](https://passwordhashing.com/BCrypt). 
- `no entries`: you must have at least one admin.

### [txAdmin:ConfigVault] Error: Unnable to load configuration file 'data/default/config.json'
You haven't created the `default` server profile, execute `node src/scripts/setup.js default` to create it.  
Note: This also applies for any other server profile. You can create new profiles by executing `node src/scripts/setup.js <profile name>`
Note2: If on Linux, make sure there is no permission issue (eg file owned by the root account).  


## Problems running FXServer 
When you start txAdmin, your server will **not** start automatically (by default). Open the web panel and start txAdmin (actions > START Server). You can change this by enabling autostart in the settings page.  
If you are getting `FXServer is not responding!` it means the txAdmin:Monitor could not connect to the FXServer. Check the two items below.
- If the server is actually online and working properly (you can join the server) but txAdmin thinks it's offline, this is an issue with FXServer and not txAdmin. Nothing we can do.
- If you are having trouble starting the FXServer via txAdmin, run `node src/scripts/config-tester.js default` and see which test is failing.  

<hr>

If this guide didn't help you, open an Issue or join our awesome [Discord server](https://discord.gg/f3TsfvD).
