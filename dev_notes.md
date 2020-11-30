## TODO v3
- [x] deployer: add download_github action
- [x] clean this file
- [ ] improve setup page common template incompatibility behavior and set $engine to 2
- [ ] xxxxxxx


> Hopefully now:
- [ ] make playerController.writePending prioritized (low 5s, medium 30s, high 60s)
- [ ] create `admin.useroptions` for dark mode, welcome modals and such
- [ ] IF deploy fails, add a `_DEPLOY_FAILED_DO_NOT_EDIT` file to deploy path
- [ ] add disabled input with the username on the pagina que salva a senha
- [ ] remove the ForceFXServerPort config and do either via `server.cfg` comment, or execute `endpoint_add_tcp "127.0.0.1:random"`
- [ ] improve terminal onboarding? Nem que seja só um pouquinho...
- [ ] merge some PRs
- [ ] add discord group whitelist (whitelist switch becomes a select box that will enable guildID and roleID)
- [ ] persistent discord status message that is set up by `!setmessage`:
        - this will trigger a big status message to be sent in that channel
        - this message id can be stored in the config file
- [ ] Upgrade packages:
        - check if `got` patch was published - https://github.com/sindresorhus/got/pull/1491
        - try to upgrade `webpack`
        - see if the `open` library was fixed
        - try to upgrade `dateformat`
        - attempt to use `discord.js` v12
- [ ] add stats enc?


> Soon™ (hopefully the next update)
- [ ] send log via FD3
- [ ] replace `clone` with `lodash/clonedeep` and check the places where I'm doing `Object.assign()` for shallow clones
- [ ] apply the new action log html to the modal
- [ ] add `<fivem://connect/xxxxx>` to `/status` by getting `web_baseUrl` maybe from the heartbeat
- [ ] add ban server-side ban cache (last 500 bans?), updated on every ban change 
- [ ] add a commend system?
- [ ] add stopwatch (or something) to the db functions and print on `/diagnostics`
- [ ] change webserver token every time the server starts


> Soon™® (hopefully in two months or so)
- [ ] get all functions from `web\public\js\txadmin\players.js` and wrap in some object.
- [ ] add some chart to the players page?
- [ ] tweak dashboard update checker behavior
- [ ] add an fxserver changelog page
- [ ] Social auth provider setup retry every 15 seconds
- [ ] show error when saving discord settings with wrong token
- [ ] break down playerController into separate files!
- [ ] rename playerController to playerManager?
- [ ] make heartbeats go through FD3?


## Bot Commands:
DONE:
/addwl <wl req id>
/addwl <license>

TODO: Bot commands (in dev order):
/kick <mention>
/log <mention> - shows the last 5 log entries for an discord identifier (make it clear its only looking for the ID)
/ban <mention> <time> <reason>
/unban <ban-id>

/info - shows your info like join date and play time
/info <mention> - shows someone else's info
/addwl <mention>
/removewl <mention>

## "in the roadmap"
- [ ] Check config management libraries (specially 'convict' by Mozilla and nconf)


=======================================

## CLTR+C+V
```bash
# run
cd /e/FiveM/builds
nodemon --watch "3247/citizen/system_resources/monitor/src/*" --exec "3247/FXServer.exe +set txAdmin1337 IKnowWhatImDoing +set txAdminVerbose truex +set txAdminFakePlayerlist yesplzx"

# build
cd /e/FiveM/builds/3247/citizen/system_resources/monitor
rm -rf dist
npm run build

# upgrade util:
npm-upgrade

# F8
con_miniconChannels script:monitor*
```

=======================================

## Links + Random Stuff

### CoreUI Stuff + Things I use
https://simplelineicons.github.io
https://coreui.io/demo/3.1.0/#icons/coreui-icons-free.html
https://coreui.io/demo/3.0.0/#colors.html
https://coreui.io/docs/content/typography/

https://www.npmjs.com/package/humanize-duration
https://kinark.github.io/Materialize-stepper/


### Reference stuff
https://www.science.co.il/language/Locale-codes.php


### Log Stuff:
https://www.npmjs.com/package/rotating-file-stream
https://www.npmjs.com/package/file-stream-rotator
https://www.npmjs.com/package/simple-node-logger
https://www.npmjs.com/package/infinite-scroll


### "Look into it"
https://www.reddit.com/r/javascript/comments/91a3tp/why_is_there_no_small_sane_nodejs_tool_for/

Interesting shit, could be used to give like vMenu admin powers to txAdmin admins:
https://github.com/citizenfx/fivem/commit/fd3fae946163e8af472b7f739aed6f29eae8105f

Grafana query for the `/perf/` endpoint data: 
`histogram_quantile(0.95, sum(rate(tickTime_bucket[5m])) by (le))`

"State bag" support for C#
https://github.com/citizenfx/fivem/pull/516
https://github.com/citizenfx/fivem/pull/539


### server deployer original idea
https://discordapp.com/channels/192358910387159041/450373719974477835/701336723589955654

### the ace permissions editor thing
https://discordapp.com/channels/192358910387159041/450373719974477835/724266730024861717



=======================================

### Global vs Individual Modules
- Global
    - authenticator
    - discordBOT
    - logger
    - webserver
    - translator
    - players db (new)
    - config global (new)

- Individual
    - fxrunner
    - monitor
    - configvault

### Global vs Individual Pages
- Full Dashboard: Each row will be be one server, with: controls, stats (players, hitches, status), player chart
- Players
- Diagnostics: host + processes + multiple individual server info
- Admin Manager
- txAdmin Log
- Global Settings
- Servers:
    - live console
    - resources
    - log
    - cfg editor
...and maybe more, but now I'm going to sleep
