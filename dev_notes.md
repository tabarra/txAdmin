## TODO v3
- [ ] xxxxx
- [ ] xxxxx

`{user.id}` Welcome to the party, {user}! Please read #tutorial-txadmin🔥 

### Setup Stepper:
1. Welcome
2. Server Name
3. Deployment import type:
    - Common Template
    - URL Template
    - Local Server Data

    4. Select Template (cards)
    5. Show data location

    4. Import Remote Template (URL input)
    5. Show data location

    4. Local Server Data
    5. Server CFG File

6. Finish
    - save configs
    - if local:
        - start server
        - redirect to live console
    - if template
        - redirect to deployer


setup não faz download
vai pra página do deployer que é um stepper
1. cfg file, será salvo como base.cfg
2. progress, baixar tudo
3. botão start
vai pro live console
e quando terminar só vai mostrar um cfg file pr ousuário configurar algumas coisas




TODO: Bot commands (in dev order):
/addwl <wl req id>
/addwl <license>

/kick <mention>
/log <mention> - shows the last 5 log entries for an discord identifier (make it clear its only looking for the ID)
/ban <mention> <time> <reason>
/unban <ban-id>

/info - shows your info like join date and play time
/info <mention> - shows someone else's info
/addwl <mention>
/removewl <mention>

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

## "in the roadmap"
- [ ] Check config management libraries (specially 'convict' by Mozilla and nconf)
- [ ] revisit the issue with server restarting too fast (before close) and the the bind failing, causing restart loop. Almost all cases were windows server 2012.
- [ ] xxxxxx

=======================================

## CLTR+C+V
```bash
# run
cd /e/FiveM/builds
nodemon --watch "3004/citizen/system_resources/monitor/src/*" --exec "3004/FXServer.exe +set txAdmin1337 IKnowWhatImDoing +set txAdminVerbose true +set txAdminFakePlayerlist yesplz"

# build
cd /e/FiveM/builds/3004/citizen/system_resources/monitor
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

### CoreUI Stuff
https://simplelineicons.github.io
https://coreui.io/demo/3.1.0/#icons/coreui-icons-free.html
https://coreui.io/demo/3.0.0/#colors.html
https://coreui.io/docs/content/typography/


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


### the ace permissions editor thing
https://discordapp.com/channels/192358910387159041/450373719974477835/724266730024861717
