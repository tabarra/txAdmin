## TODO v2
- [x] player page: fix ban ids permission
- [x] player page: add expiration note to the action history
- [x] ignore EPIPE koa errors
> v2.5.1
- [ ] xxxxx


> Soon™
- [ ] make warns un-revokable?
- [ ] monitor checks for duplicate active users every 10 minutes, then reports in diagnostics page
- [ ] check everything done for xss
- [ ] apply the new action log html to the modal
- [ ] adapt all modal actions to offline players
- [ ] check why scheduled restarts are not kicking players
- [ ] make `fxRunner.srvCmd()` itself perform the escaping
- [ ] adapt kick messages to use some basic HTML for formatting
- [ ] change Server Log page to use the new modal
- [ ] replace `clone` with `lodash/clonedeep` and check the places where I'm doing `Object.assign()` for shallow clones
- [ ] convert cl_logger.js to lua, and stop it when not in `monitorMode`
- [ ] try again the upgrade to Discord.js v12
- [ ] add `<fivem://connect/xxxxx>` to `/status` by getting `web_baseUrl` maybe from the heartbeat
- [ ] add ban server-side ban cache (last 500 bans?), updated on every ban change 
- [ ] add a commend system?
- [ ] add stopwatch (or something) to the db functions and print on `/diagnostics`
- [ ] change webserver token every time the server starts

NOTE: when opening a player from the offline list, disable ID-requiring actions like dm,kick,warning

> Soon™®
- [ ] add some chart to the players page?
- [ ] the weekly playtime counter per user?
- [ ] tweak dashboard update checker behavior
- [ ] add an fxserver changelog page
- [ ] Social auth provider setup retry every 15 seconds
- [ ] show error when saving discord settings with wrong token
- [ ] break down playerController into separate files?
- [ ] rename playerController to playerManager?

## "in the roadmap"
- [ ] Auto updater for txAdmin?
- [ ] Check config management libraries (specially 'convict' by Mozilla and nconf)
- [ ] Add "discord client id" in the admin settings, this would enable "/kick @user"
- [ ] revisit the issue with server restarting too fast (before close) and the the bind failing, causing restart loop. Almost all cases were windows server 2012.
- [ ] xxxxxx

=======================================

## CLTR+C+V
```bash
# run
cd /e/FiveM/builds
npx nodemon --watch "2539/citizen/system_resources/monitor/src/*" --exec "2539/FXServer.exe +set txAdmin1337 IKnowWhatImDoing +set txAdminVerbose truex +set txAdminFakePlayerlist yesplzx"

# build
cd /e/FiveM/builds/2539/citizen/system_resources/monitor
rm -rf dist
npm run build

# upgrade util:
npm-upgrade

# F8
con_miniconChannels script:monitor*
```

### Links + random stuff
https://api.github.com/repos/tabarra/txAdmin/releases/latest
https://www.science.co.il/language/Locale-codes.php
https://www.npmjs.com/package/humanize-duration
https://www.npmjs.com/package/dateformat
https://www.npmjs.com/package/dateformat-light
https://date-fns.org/v2.0.1/docs/formatDistance

https://www.reddit.com/r/javascript/comments/91a3tp/why_is_there_no_small_sane_nodejs_tool_for/

DIV transition: https://tympanus.net/Tutorials/OriginalHoverEffects/index9.html
Colors: https://coolors.co/3c4b64-3c4b64-3a4860-1e252d-252e38
CSS Animated: https://daneden.github.io/animate.css/

Interesting shit, could be used to give like vMenu admin powers to txAdmin admins:
https://github.com/citizenfx/fivem/commit/fd3fae946163e8af472b7f739aed6f29eae8105f

Grafana query for the `/perf/` endpoint data: 
`histogram_quantile(0.95, sum(rate(tickTime_bucket[5m])) by (le))`


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



Questões:
- É possível tirar o webserver pra fora do txAdmin?
    - Teria que tirar o verbose pra fora
    - Criar um metodo pra setar rotas full + atachar socket.io
    - Puxar o Authenticator pra fora
- É possível mudar as rotas depois?
    - Sim
- É possível Puxar o autenticator pra fora?
    - Sim
- É possível só iniciar o txAdmin depois?
    - Sim
- Isso vai deixar o código muito zuado?
- Vai valer a pena?



### base clonning idea
Context: https://discordapp.com/channels/192358910387159041/450373719974477835/701336723589955654
Recipie example:
```yaml
tasks:
  - clone_repo:
      url: https://github.com/citizenfx/cfx-server-data.git
      path: .
  - clone_resource:
      url: https://github.com/meow64bit/uberadmin.git
      resourceDir: uberadmin
  - download_archive:
      url: https://github.com/wtf/wtfwtf/releases/v1.2.3/resource.zip
      resourceDir: wtfwtf
      stripPath: wtfwtf/
  - download_file:
      url: https://docs.fivem.net/blah/server.cfg
      path: server.cfg
  - replace_file:
      path: server.cfg
      pattern: 's/wtf/ftw/g'
  - append_file:
      path: server.cfg
      data: 
         start wtfwtf
         start uberadmin
```
