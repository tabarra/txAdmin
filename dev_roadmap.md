## TODO/Roadmap:
- [x] Fix potential memory exhaustion DoS
- [x] Add Explosion type decoding
- [x] Add Custom logging method + docs
- [x] Diagnostics Page:
    - [x] Incompatible version warning
    - [x] Global crash counters + uptime
    - [x] If on Linux, correctly name the process as FXServer
- [x] Route Error Verbosity
- [x] Detect failed server launch
- [x] Move the start.bat file to the root dir
- [ ] Try the dark theme scss
- [ ] Make toggle button

Major stuff:
- [ ] Check compiling libraries like pkg and nexe.
- [ ] Check config management libraries (specially 'convict' by Mozilla and nconf)
- [ ] Auto updater with simple-git/promise
- [ ] Make messages/commands.json via lowdb and remove the `Players online` and `File reloaded` spam.

Medium stuff:
- [ ] Add "discord client id" in the admin settings, this would enable "/kick @user"

Minor stuff:
- [ ] Hide the verbosity option. People don't fucking read and click on it anyway,
- [ ] xxxxxx


### Feature tasks for collaborators:
- Logger:
    - [-] Revert txAdminClient cl_logger.js back into lua and fix the mismatch of killer ID from client to server
    - [ ] Listen for the most common vRP and ESX server events and log them
    - [x] Divide the interface vertically, and on the right add filter options (HTML/CSS Only)
    - [ ] Make the javascript for hiding events based on the `data-event-type` attribute
    - [.] Create a "load more" at the top of the log, for the admin too be able to see older entries.
- [x] When restarting the server, add the name of the admin to the chat/discord messages.
- [x] When sending a DM as admin, add the name of the admin
- [x] Add localized uptime to the /status command and review the usage of the dateformat lib
- [x] Add to the resources page an option to see/hide the default cfx resources
- [ ] Dark Theme!

x = done
- = being worked on
. = on hold


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
- [x] functional ban page with ban add, list and export
- [x] ban feature at sv_main.lua
- [x] tie everything correctly and push update
- [x] fix playerlist div name issue
- [x] Fix paths with spaces (too hard, just block in the settings page)
- [ ] Apple xss whitelist [] to all xss() calls (vide src\webroutes\diagnostics-log.js)

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
