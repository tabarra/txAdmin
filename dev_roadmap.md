## TODO/Roadmap:
- Check compiling libraries like pkg and nexe.
- Check config management libraries (specially 'convict' by Mozilla and nconf)
- Auto updater with simple-git/promise
- Add "discord client id" in the admin settings, this would enable "/kick @user"
- Do something in case fxserver's tcp/http endpoint dies for more than 5 minutes

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
