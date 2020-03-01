## TODO Conversion
> didn't keep track of what came before, but basically: new auth system, from express to koa
> v2.0.0-conv
- [x] why auto login when creating master doesn't work??
- [x] acessar /auth?logout da state mismatch
- [x] wrong ip, check x-forwarded-for
- [x] do I still need the clientCompatVersion convar?
- [x] build path to the global info - check for globals.fxRunner.something
- [x] add txDataPath convar + docs
- [x] reorganize globals.info.xxx
- [x] remover messages.json temporariamente
- [x] add the stdout sniffer for wrong port and hangs (*must* be improved tho)
- [x] Fix bug: new profile > save global settings > reload page > fxserver: both will be undefined
- [x] clean this dumb file
- [x] perform end2end test
> v2.0.0-rc1
- [ ] when you open the settings page, go directly to the fxserver tab
- [ ] improve monitor?
- [ ] clean up the resource injector?
- [ ] hide memory usage on linux?
- [ ] disable editing the master admin by other admins
- [ ] Social auth provider setup retry every 15 seconds
- [ ] Rework the entire monitor
- [ ] improve responsivity on smaller monitors (between 1474 and 900 width)
> v2.0.0
- [ ] show error when saving discord settings with wrong token
- [ ] fix bug: resources page when you type then delete what you typed, it shows hidden default resources


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
