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
- [ ] announce discord autorestarts and when the server is started/restarted
> v1.3.0
- [ ] create admin page template
- [ ] create functions to add/remove/edit admins
- [ ] create endpoints/javascript for  the functions above
- [ ] create method to register new permissions
> v1.4.0
- [ ] resource injection
- [ ] temp intercom endpoint
- [ ] make txAdminClient report it's alive
- [ ] prevent auto restarter from killing a working server
> v1.5.0
- [ ] custom commands




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


## Ideia pros buffers
- todo output do fxchild (stdout+stderr) é escrito em um buffer, assim como mensagens de START server (igual os logs de admin)
- a cada 10 segundos uma função cron vai dar uma slice (estilo tail) nesse buffer e pegar tudo novo e vai salvar no arquivo de log
- ao abrir o webconsole, enviar o último 8k de dados a partir do primeiro \n
- o buffer de cmd output é só pegar o length e depois dar slice (se for menor pegar tudo do zero pq truncou)
