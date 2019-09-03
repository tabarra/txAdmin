## TODO/Roadmap:
Major stuff:
- [ ] Check compiling libraries like pkg and nexe.
- [ ] Check config management libraries (specially 'convict' by Mozilla and nconf)
- [ ] Auto updater with simple-git/promise
- [ ] Make a FileWatcher module with chokidar (or something) and clear the `Players online` spam.

Medium stuff:
- [ ] Add "discord client id" in the admin settings, this would enable "/kick @user"
- [ ] Do something in case fxserver's tcp/http endpoint dies for more than 5 minutes
- [x] Let admins change their password
- [ ] Create a init.cfg for the fxserver to execute containing all txAdmin commands
- [ ] Revert txadminclient cl_logger.js back into lua and fix the mismatch of killer ID
- [x] Improve server log page 

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


## TODO Now
- [x] freeze detector
- [x] inject via tmp file
- [x] experiements dropdown menu + ban page html/js
- [x] database module
- [ ] functional ban page with ban add, list and export
- [ ] ban feature at sv_main.lua


## Databases:
Discarted due to node-gyp: level, better-sqlite3, sqlite3

- dblite
    - 165/week  
    - 0 deps  
    - 6 months ago  
    - spawn sqlite-shell  
- lowdb
    - 183k/week  
    - 5 deps  
    - 2 years ago  
    - lodash front end, can query data  
- sql.js
    - 26k/week  
    - 0 deps  
    - 4 months ago  
    - sqlite c into webassembly  


## Ideas:
Automatic event detection by regexing all .lua files in the resources folder?  
`AddEventHandler\(["'](.+)["'].*`


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
