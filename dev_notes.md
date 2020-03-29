## TODO Conversion
> didn't keep track of what came before, but basically: new auth system, from express to koa
> v2.0.0-conv
- [x] why auto login when creating master doesn't work??
- [x] acessar /auth?logout da state mismatch
- [x] wrong ip, check x-forwarded-for
- [x] do I still need the clientCompatVersion convar? No
- [x] build path to the global info - check for globals.fxRunner.something
- [x] add txDataPath convar + docs
- [x] reorganize globals.info.xxx
- [x] remover messages.json temporariamente
- [x] add the stdout sniffer for wrong port and hangs (*must* be improved tho)
- [x] Fix bug: new profile > save global settings > reload page > fxserver: both will be undefined
- [x] clean this dumb file
- [x] perform end2end test
> v2.0.0-rc1
- [x] when you open the settings page, go directly to the fxserver tab
- [x] fix broken authorization
- [x] fix `run.cmd` compatibility with build 2270
- [x] increase ajax timeouts
- [x] disable resources page buttons when you don't have permission to use them
- [x] fix scrollbars and colors from the live console page
- [x] update packages - npm outdated
> v2.0.0-rc2
- [x] minor interface tweaks
- [x] improve responsivity on smaller monitors (between 1474 and 900 width)
- [x] clean custom.css an rename it to txAdmin.css
- [x] hide memory usage on linux?
- [x] change (fix?) cpu usage on diagnostics page
- [x] disable editing the master admin by other admins
- [x] join action/console log and protect with permission
- [x] end2end test + beta testers run
- [x] fix linux run.sh reference
- [x] update readme
> v2.0.0
- [ ] Create legacy branch + fix `run.cmd` + disable updater and add deprecated message
- [ ] clean up the resource injector?
- [ ] Rework the entire monitor
- [ ] Social auth provider setup retry every 15 seconds
- [ ] show error when saving discord settings with wrong token
- [ ] fix bug: resources page when you type then delete what you typed, it shows hidden default resources


# For the new access control system
- vRP grabs the first matched ID
- esx uses licenses
- For txAdmin:
    - `players` table: index by license ID
        - Name (overwrite on every update)
        - Last connection timestamp
        - Notes
        - Online time counter
    - `ids_events`
        - timestamp
        - IDs array
        - author (the admin name)
        - type [ban|warn]
        - message (reason)

- How do I do whitelisting in a smart way? 
    - By license? 
    - By any ID? 
    - Could we add a temp ID to memory and show it on the `deferral.done()`? 



## "in the roadmap"
- [ ] Check config management libraries (specially 'convict' by Mozilla and nconf)
- [ ] Make messages/commands.json via lowdb and remove the `Players online` and `File reloaded` spam.
- [ ] Add "discord client id" in the admin settings, this would enable "/kick @user"
- [ ] Hide the verbosity option. People don't fucking read and click on it anyway,
- [ ] xxxxxx


## ETC
```bash
cd /e/FiveM/builds
npx nodemon --watch "2116/citizen/system_resources/monitor/src/*" --exec "2116/run.cmd"
```

### Links
https://www.science.co.il/language/Locale-codes.php
https://www.npmjs.com/package/humanize-duration
https://www.npmjs.com/package/dateformat
https://www.npmjs.com/package/dateformat-light
https://date-fns.org/v2.0.1/docs/formatDistance

https://www.reddit.com/r/javascript/comments/91a3tp/why_is_there_no_small_sane_nodejs_tool_for/

DIV transition: https://tympanus.net/Tutorials/OriginalHoverEffects/index9.html
Colors: https://coolors.co/3c4b64-3c4b64-3a4860-1e252d-252e38
CSS Animated: https://daneden.github.io/animate.css/


### Global vs Individual Modules
- Global
    - authenticator
    - discordBOT
    - logger
    - webserver
    - config global
- Individual
    - config server
    - monitor
    - fxrunnder
