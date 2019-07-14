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

## TODO/Roadmap:
> v1.0.5
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
- [x] rewrite README, Troubleshooting Guide
> v1.1.0
- [x] Make fxserver output buffer class and integrate
- [x] download server log button/endpoint
- [x] add buffer size to the dashboard
> v1.2.0
- [x] parse the schedule times
- [x] send message to chat
- [x] announcements channel in discord config page
- [x] announce discord autorestarts and when the server is started/restarted
> v1.3.0
- [x] create admin page template
- [x] use the admin data inside the template
- [x] admin add/edit/delete html/js/endpoints
> v1.4.0
- [x] create methods to evaluate permission and apply to all endpoints
- [x] write doc text for the permissions
> v1.5.0
- [x] resource injection
- [x] error handler to remove the old txAdminClient
> v1.6.0
- [x] temp intercom endpoint
- [x] make txAdminClient report it's alive
- [x] prevent auto restarter from killing a working server
- [x] normalize paths when saving the settings
> v1.7.0 BETA Release
- [ ] custom commands
- [ ] ???



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
                fxserver.log
                txAdmin_errors.log
            data/
                players.json
    extensions/
        txAdminClient/
            resource/
                __resource.lua
                ...


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
