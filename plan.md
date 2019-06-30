

//FIXME: change config.json name, cant be both named the same

data/
    config.json (web port, admins)
    example/
        config.json
        messages.json
        commands.json
        data/
            players.json
            admin.log
            FXServer.log
            txAdmin_errors.log
extensions/ ?
setup.js
start.js
start.bat


setup.js:
    checkup node version
    check packages
    start setup webpage asking for:
        login/password
        first server config (paths & etc)
    check if the configs are correct
    save data/config.json with password
    save the server config as data/default

start.js:
    checkup node version
    check packages
    start txadmin with the 'default' server config (or argv)
