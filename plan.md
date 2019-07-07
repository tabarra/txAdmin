## New Instructions
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
- [x] adapt config-tester
- [x] adapt main
- [x] write setup
- [x] prevent starting with null as options
- [x] make settings page
- [x] create config vault component
- [x] settings page validate fxserver paths
- [x] settings page save the new settings
- [x] settings page for the other scopes
- [x] fxrunner detect the endpoint ports
- [ ] rewrite README, Troubleshooting Guide and Discord Macros


## Folder Structure
    data/
        admins.json
        example/
            config.json
            messages.json
            commands.json
            start.bat
            logs/
                admin.log
                FXServer.log
                txAdmin_errors.log
            data/
                players.json
    extensions/ (?)


## Global vs Individual Modules
- Global
    - authenticator
    - discordBOT
    - logger
    - webconsole
    - webserver
- Individual
    - monitor
    - fxrunnder
