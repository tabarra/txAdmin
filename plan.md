
## Instructions
```bash
# Install
$ git clone https://github.com/tabarra/txAdmin && cd txAdmin
$ npm i

# Add admin
$ node src/scripts/admin-add.js

# Setup default server
$ node src/scripts/setup.js default

# Start default server
$ node src/index.js default
```

## TODO:
- [x] adapt admin-add 
- [ ] adapt config-tester
- [ ] adapt main
- [ ] xxx
- [ ] xxx


## Folder Structure
    data/
        admins.json
        example/
            config.json
            messages.json
            commands.json
            data/
                players.json
                admin.log
                FXServer.log
                txAdmin_errors.log
    extensions/ (?)
    start_default.bat



## setup.js
    check node version & packages
    check for existing settings and --overwrite
    start setup webpage asking for:
        basic server config (paths & etc)
    check if the configs are correct
    save data/config.json with password
    save the server config as data/default


