## TODO v3
- [x] Server Deployer with recipe engine!
- [x] replace `localhost` with `127.0.0.1` in functions to force usage of ipv4
- [x] rename `ctx.utils.appendLog` to `logCommand` then replace it and all `globals.logger.append` for consistency
- [x] added permission descriptions (`all_permissions` > `All Permissions`)
- [x] fix heartbeat FD3 vs HTTP stats
- [x] fix hardcoded 180s cooldown for slow server starts and add boot time statistics
- [x] add a bunch of stats
- [x] downgrade `open` library and autofill the pin
- [x] completed recipe engine with the following actions: `waste_time`, `fail_test`, `download_file`, `remove_path`, `ensure_dir`, `unzip`, `move_path`, `copy_path`, `write_file`, `replace_string`, `connect_database`, `query_database`
- [x] upgrade packages
- [x] add custom recipe option to setup/deployer
- [x] make cfx default recipe and populate `@tabarra/txAdmin-recipes`
- [x] update setup page to read `@tabarra/txAdmin-recipes`
- [x] add option to reset fxserver settings & return to setup
- [x] merge dark mode
- [x] added tmpLooksLikeRecipe to stats
- [x] test everything on latest fxserver + webpack and linux (check deployer and systeminformation memory)
- [x] reset timestamp + write changelog + version bump
> v3.0.0
- [x] fix linux build pipeline
> v3.0.1
- [x] fixed resources page breaking due to weird inline json escaping
- [x] added ban reason to server join rejection message
- [x] assorted css fixes (mainly toggle switches)
- [x] versiom bump


> Do as soon as v3.0.0 is out:
- [ ] make playerController.writePending prioritized (low 5s, medium 30s, high 60s)
- [ ] clean this file
- [ ] create `admin.useroptions` for dark mode, welcome modals and such
- [ ] IF deploy fails, add a DO_NOT_EDIT_DEPLOY_FAILED file to deploy path
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

### Setup Stepper:
1. Welcome
2. Server Name
3. Deployment import type: (select box or a "multiline radio box" with description)

- Common Template
    4. Select Template (cards)
    5. Suggest data location

- URL Template
    4. Import Remote Template (URL input)
    5. Suggest data location

- Local Server Data
    4. Local Server Data
    5. Server CFG File

6. Finish
    - save configs
    - if local:
        - start server
        - redirect to live console
    - if template
        - redirect to deployer

### Deployer stepper:
- Review Recipe:
    Show a code editor with the recipe, and some variables extracted from it.
    Extracted fields:
    - Author
    - Description
    - Version
    - URL
    Add a RED warning regarding running recipes from untrusted sources

- Run Recipe
    Something akin to live console, but no need to overengineer it!
    At most an ajax that calls an API that will return the contents to a `<pre>`, and maybe a % to a progressbar.

- Configure `server.cfg`
    Code editor with the contents of the `server.cfg` file specified inside the recipe.
    This will be the file containing the configuration of the base for the user to type, like hostname, mysql, RP-stuff...
    Then a `Save & Start Server` button.

### Deployer Notes:
- Setup page does not execute anything, only sets the variables and start the server or redirects to the deployer.
- Will force deployer bases to be `txData/xxx.base`. (check `.endsWith()` on profile selection)
- If people want to try their own template file, they can select the "default" template and edit the recipe before running it
- In the deployer page there will be an "cancel and go back to setup page" button.
- The setup page will have a way to autofill inputs if its not the first time running it
- If the admin master wants to run an new recipe, there should be a button in the settigs page for him to be able to do so (github's "danger zone" ?).


### Deployer logic
- Setup page:
    - Condition: globals.deployer == null && (serverDataPath === null || cfgPath === null)
    - Local deploy actions: sets serverDataPath/cfgPath, starts the server, redirect to live console
    - Template deploy actions: download recipe, globals.deployer = new Deployer(recipe)

- Deployer page:
    - Condition: globals.deployer !== null
    - Post-deploy actions: 
        - set serverDataPath/cfgPath
        - reset globals.deployer
        - start the server
        - redirect to live console

- Normal txAdmin:
    - IF globals.deployer THEN redirect to deployer
    - ELSE IF (serverDataPath === null || cfgPath === null) THEN redirect to setup

- To Reset:
    - Stop server
    - serverDataPath = null; cfgPath = null;
    - Redirect to setup


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
nodemon --watch "3120/citizen/system_resources/monitor/src/*" --exec "3120/FXServer.exe +set txAdmin1337 IKnowWhatImDoing +set txAdminVerbose true +set txAdminFakePlayerlist yesplz"

# build
cd /e/FiveM/builds/3120/citizen/system_resources/monitor
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
      data: |
         start wtfwtf
         start uberadmin
```


### the ace permissions editor thing
https://discordapp.com/channels/192358910387159041/450373719974477835/724266730024861717
