## TODO/Roadmap:
Major stuff:
- [ ] Check compiling libraries like pkg and nexe.
- [ ] Check config management libraries (specially 'convict' by Mozilla and nconf)
- [ ] Auto updater with simple-git/promise
- [ ] Make a FileWatcher module with chokidar (or something) and clear the `Players online` spam.

Medium stuff:
- [ ] Add "discord client id" in the admin settings, this would enable "/kick @user"
- [ ] Do something in case fxserver's tcp/http endpoint dies for more than 5 minutes
- [ ] Let admins change their password
- [ ] Create a init.cfg for the fxserver to execute containing all txAdmin commands
- [ ] Revert txadminclient cl_logger.js back into lua and fix the mismatch of killer ID

Minor stuff:
- [x] Remove del in favour of fs-extra.emptyDir https://github.com/jprichardson/node-fs-extra/blob/master/docs/emptyDir.md
- [x] Remove figlet (also from the login page)
- [x] Remove pretty-ms
- [ ] Restart reason add current admin name
- [ ] Add the name of the admin that sent the DMs
- [ ] Add localized uptime to the /status command and review the usage of the dateformat lib
- [x] Improve CSS of the log pages on mobile, they look too tiny
- [ ] xxxxxx
- [ ] xxxxxx
- [ ] xxxxxx
- [ ] xxxxxx


## Links
https://www.science.co.il/language/Locale-codes.php
https://www.npmjs.com/package/humanize-duration
https://www.npmjs.com/package/dateformat
https://www.npmjs.com/package/dateformat-light
https://date-fns.org/v2.0.1/docs/formatDistance

https://www.reddit.com/r/javascript/comments/91a3tp/why_is_there_no_small_sane_nodejs_tool_for/

DIV transition: https://tympanus.net/Tutorials/OriginalHoverEffects/index9.html


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
