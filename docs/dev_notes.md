# TODO:
v4.17.0:
- [x] reorganize folders
- [x] migrate core to esbuild
- [x] migrate menu to vite
- [x] docs: new structure, building, developing
- [x] convert txAdmin to ESM
- [x] add option to set the resource load max time
- [x] add player id view permission + logging
- [x] ask bubble to rm the cicd cache or add a `rm -rf` to the target folder

Optional:
- [ ] add actionRevoked event (rewrite PR #612)
- [ ] rewrite the GET /status endpoint (close PR #440)
- [ ] add option to skip or add time to schedules restart
- [ ] add option to schedule a restart (single shot, non persistent)
- [ ] stats: add recipe name + if ptero + random collisions
- [ ] stats: jwe
- [ ] playerlist remove rtl characters
- [ ] create beta release action


```js
console.log('aaa', {àa:true});
const {Console} = require('node:console');
// dir(Object.keys(imp))
// imp.log({àa:true});
const xxx = new Console({
    stdout: process.stdout,
    stderr: process.stderr,
    colorMode: true,
});

const chalk = require('chalk');
const tag = chalk.bold.bgBlue(`[test]`)
const testLog = (...args) => xxx.log.call(null, tag, ...args)

testLog({àa:true});
log('adsfsdf')

import consoleFactory from '@utils/console.js';
const console = consoleFactory(modulename)

process.exit();
```
remover lodash dep e ficar só com lodash-es?

Move verbose to be part of the console (after the functional-ish change)
and then remove the GlobalData from a bunch of files which include it just because of verbosity

NOTE:

https://medium.com/slackernoon/use-typescript-aliases-to-clean-up-your-import-statements-7210b7ec2af1
nice ESM guide https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c
https://github.com/sindresorhus/typescript-definition-style-guide

## Client game print issue
https://github.com/citizenfx/fivem/commit/cafd87148a9a47eb267c24c00ec15f96103d4257
https://github.com/citizenfx/fivem/commit/84f724ed04d07e0b3a765601ad19ce54412f135b


Up next-ish:
- [ ] Tooling:
    - [ ] Inline `.deploy.config.js > copy[]` into `main-builder.js`
    - [ ] Use `dotenv` or something to read FXServer's path from
    - [ ] Adapt `main-builder.js` to accept txAdmin convars
    - [ ] Update `development.md`
- 'txaLogger:menuEvent' outros resources conseguem chamar?
- [ ] add ram usage to perf chart?
- [ ] dm via snackbar
- [ ] wav for announcements
- [ ] update `README.md`
- [ ] replace `txaDropIdentifiers` with `txAdmin:events:playerBanned` hook
- [ ] Migrate console log to new logger
- [ ] Migrate all log routes
- [ ] Add download modal to log pages
- [ ] replace all fxRunner.srvCmd* and only expose:
    - sync fxRunner.srvRawCmd(string) - to be used by live console
    - async fxRunner.srvCmd(array, timeout) - to be awaited with the status response
- [ ] Quebrar snackbar de not admin em dois, um se confirmado que o problema são os identifiers, outro pra qualquer outro tipo de problema
- [ ] after menu client messages rework, add lua54


### Randoms:
Change pls the expired ban color to red or something else, because the must people dont know if the ban now expired or be revoked
- BUG: nui menu triggered announcements are not sent to the discord

-- Why both have the same debug data? https://i.imgur.com/WGawiyr.png

FIXME: sendMenuMessage('setServerCtx', ServerCtx)

FIXME: quando o menu abrir, deveria voltar os list item pro default deles

-- Adapt `txAdmin:beta:deathLog` as well as add cusstom commands and logs

- pagina de adicionar admin precisa depois do modal, mostrar mais info:
    - username, senha, potencialmente link, instruções de login
- FreezeEntityPosition need to get the veh
    - já foi feito? tem issue aberto, e já teve um pr feito
- começar a ler o ui_label dos manifests e usar na página de resources




### txAdminAPI interface in base.js:
- Create prop `pendingMessage` to replace `const notify = $.notify({ message: 'xxxxxx' }, {});`
- Pass `notify` as last argument to `success()` and `error()`
- Create default `success()` and `error()`
    - for `success()`: first exec `checkDoLogoutRefresh()`
    - if `pendingMessage` was set: 
        - if data.markdown === true > usar markdown
    - else: send new notify

someday remove the slash() and the ascii restrictions



### Multiserver refactor:
Global:
- WebServer
- AdminVault
- ConfigVault
- DiscordBot
- Logger
- Translator
- DynamicAds
- UpdateChecker > CfxUpdateChecker

Instance[]:
- FXRunner
- Monitor > HealthMonitor
- Scheduler
- PlayerController > PlaylistManager
- ResourcesManager
- StatsCollector > StatsManager

Questions:
- How to make the database interface (currently in playerController)
- Should break logger and config in 2 or work top->down?


### New UI stuff
tentar usar vite
react-query usar 100%
procurar alternativas pro react-router (wouter)
https://auto-animate.formkit.com


### Update Event + Rollout strategy
This is not compatible with the update events.
If patch, show update notification immediately (specially important to quick-fix a bug).
If minor, randomize a delay between 0~24h.
If patch, randomize a delay 0~72h.


Update event idea (not yet greenlit):
- A box similar to the fxserver update one;
- The major/minor updates will have a discord stage event, patches won't;
- Will get the next event date + type (major/minor) through some api (maybe a regex-able string in the GH releases page);
- The pre-event notifications will have a live "in xx time" type countdown
- 2 days before it will show a yellow warning;
- 1 hour before it will become a glowing green box;
- 1 hour after the event start it will become a red update box with generic message, or blue if it's just a patch;
- Note: regarding the changelog part, bubble asked me to ignore for now (may/13) but will talk again somewhen;


### Superjump
CreateThread(function()
  local Wait = Wait
  local id = PlayerId()
  while true do
    SetSuperJumpThisFrame(id)
    Wait(0)
  end
end)


### refactor settings:
- save only what changed
- make big settings a class (like TFR)
- settings.getConfig(); - returns the full config tree with unset props as null
- settings.get('object.dot.notation');
- settings.set('object.dot.notation');
- npm search for "object dot"


### TP:
https://freesound.org/search/?q=teleport&page=6#sound
    https://freesound.org/people/Dpoggioli/sounds/196907/
    https://freesound.org/people/DWOBoyle/sounds/474179/
    https://freesound.org/people/DWOBoyle/sounds/474180/
    https://freesound.org/people/michael_kur95/sounds/254541/


### Gun:
https://freesound.org/search/?q=toy+gun&f=&s=score+desc&advanced=0&g=1
https://freesound.org/browse/tags/laser/?page=5#sound
    https://freesound.org/people/nsstudios/sounds/344276/
    https://freesound.org/people/HadaHector/sounds/446383/
    https://freesound.org/people/unfa/sounds/193427/


### Log page time slider
> We could totally do like a "jump in time" feature for the log page.
> A slider with 500 steps, and an array with 500 timestamps
> this array can be done by dividing the serverLog.length to get the step, then a for loop to get the timestamps


### New database alternatives:
> check the chat saved messages on that chat
- Via lowdb + journal:
    - Keep players saved the way it is (lowdb, one server only)
    - create `txData/actions.json` which is an append-only, line delimited json
    - multiple servers write to this file, use debounced chokidar to read it starting from last offset to reload in-memory state;
- Via sqlite:
    - first txadmin to run will instantiate a `txData/actions.sqlite` database (becoming master)
    - will provide an http endpoint for the slaves to query data
    - leader election can be done via the first to acquire a lock on a file
- Via external server process
    - If server is not running, a standalone server like cockroachdb or rqlite
    - 

Ideas:
- Maybe we could use b-trees to index identifiers/hwids somewhere?
- Maybe we break the separation between players and identifiers, and bans/warns always try to find the respective player
- Maybe we could go full `mongod.exe`
    - very mature, great docs
    - 45mb file, 120mb process
    - to search for ids we can do `{identifiers: {$in: ['discord:xxxxx', 'fivem:yyyyy']}}`

Databases that i didn't check yet:
https://github.com/indradb/indradb
https://github.com/erikgrinaker/toydb
https://github.com/skytable/skytable
https://github.com/meilisearch/meilisearch
https://github.com/redwood/redwood
https://github.com/arangodb/arangodb
https://github.com/duckdb/duckdb





### txAdmin API/integrations:
- ban/warn/whitelist + revoke action: probably exports with GetInvokingResource() for perms 
- get player info (history, playtime, joindate, etc): state bags
- events: keep the way it is
> Note: confirm with bubble
> Don't forget to add a integrations doc page + to the readme
> for menu and internal stuff to use token-based rest api: ok, just make sure to use the webpipe proxy
> for resource permissions, use resource.* ace thing, which also works for exports

> for ban things, bubble wants a generic thing that is not just for txadmin, so any resource could implement it
> so its not exports.txadmin.xxxx, but some other generic thing that bubble would need to expose

> querying user info: in-server monitor resource should set specific state keys (non-replicated), which get properly specified so other resources can also populate any 'generic' fields. thinking of kubernetes-style namespaces as java-style namespaces are disgusting (playerdata.cfx.re/firstjoin or so)
> bans: some sort of generic event/provide-stuff api. generic event spec format is needed for a lot of things, i don't want 'xd another api no other resource uses', i just want all resources from X on to do things proper event-y way
> --bubble
https://docs.fivem.net/docs/scripting-manual/networking/state-bags/

ps.: need to also include the external events reporting thing


### Admin ACE sync:
On server start, or admins permission change:
- write a `txData/<profile>/txAcePerms.cfg` with:
    - remove_ace/remove_principal to wipe old permissions (would need something like `remove_ace identifier.xxx:xx txadmin.* any`)
    - add_ace/add_principal for each admin
- stdin> `exec xxx.cfg; txaBroadcast xxxxx`

- We should be able to get rid of our menu state management, mainly the part that sends to lua what are the admin ids when something changes
To check of admin perm, just do `IsPlayerAceAllowed(src, 'txadmin.xxxxxx')`
> Don't use, but I'll leave it saved here: https://github.com/citizenfx/fivem/commit/fd3fae946163e8af472b7f739aed6f29eae8105f


### txPointing (old txBanana)
- code prototype with ItsANoBrainer#1337
- keybind to toggle gun (grab or put away)
- when you point at player, show above head some info
- when you "shoot" it will open the player menu and hopefully fire a laser or something
- when you right click, slap player (ApplyDamageToPed 5 damage + small psysichs push up and x+y random)


### recipe engine todo:
- checksum for downloaded files
- remove_path accept array?
- every X download_github wait some time - maybe check if ref or not, to be smarter
- https://github.com/isomorphic-git/isomorphic-git
- easy recipe tester
- fully automated deploy process via CLI. You just set the recipe file path, as well as the required variables, and you can get your server running without any user interaction.


### Report System (random ideas)
- persistent, save in database?
- have two different status: visited (arr of admins), closed (admin that closed)
- this one is worth having discordwebhook

References (get usage count):
https://forum.cfx.re/t/release-admin-reply-report-command/73894
https://forum.cfx.re/t/release-esx-ban-warning-help-assist-system/786080
https://forum.cfx.re/t/release-badgerreports-reports-through-discord-and-in-game/1145714/1
https://forum.cfx.re/t/release-fivem-advanced-reports-system/1798535
https://forum.cfx.re/t/esx-advanced-report/1636000
https://forum.cfx.re/t/standalone-esx-reportsystem-a-completely-innovative-report-system-paid/3710522
https://forum.cfx.re/t/free-esx-simple-mysql-reports-system/3555465
https://forum.cfx.re/t/paid-esx-new-advanced-report-system/4774382
https://forum.cfx.re/t/standalone-advanced-report-system/4774403/1



=======================================

Small Stuff:
- [ ] try json stream on lowdb
- [ ] block execution if GetCurrentResourceName() != 'monitor'
- [ ] player modal must show if the user is banned/whitelisted or not, and an easy way to revoke it
- [ ] check EOL and warn user - new Date('2021-09-14T07:38:51+00:00').getTime()
- [ ] on recipe import, check if indexOf('<html>')
- [ ] enable squirrelly file caching via `renderFile()`
- [ ] make the commands (kick, warn, etc) return success or danger, then edit DialogActionView.tsx
    - can be done by adding a randid to the command, then making the cmdBuffer match for `<id><OK|NOK>` 

- [ ] break `playerController` actions stuff to another file
- [ ] if isZapHosting && forceInterface, add `set sv_listingIPOverride "xxx.xxx.xxx.xxx"` in deployer
- [ ] maybe remove the sv_maxclients enforcement in the cfg file
- [ ] fix the interface enforcement without port being set as zap server?


> ASAP!:
- [ ] a way to create admins file without cfx.re 
- [ ] add discord group whitelist (whitelist switch becomes a select box that will enable guildID and roleID)
    - Manual Approval (default)
    - Discord: be in guild
    - Discord: have a role in guild
- [ ] persistent discord status message that is set up by `/statusfixed`:
    - this will trigger a big status message to be sent in that channel
    - this message id can be stored in the config file
    - if discord id is present, use that instead of name (careful with the pings!)
- [ ] (really needed?) ignore key bindings commands https://discord.com/channels/577993482761928734/766868363041046589/795420910713831446
- [ ] add custom event for broadcast


> Hopefully now:
- [ ] check the places where I'm doing `Object.assign()` for shallow clones
- [ ] create `admin.useroptions` for dark mode, welcome modals and such

> Soon™ (hopefully the next update)
- [ ] get all functions from `web\public\js\txadmin\players.js` and wrap in some object.
- [ ] maybe hardcode if(recipeName == plume) to open the readme in a new tab
- [ ] add new hardware bans
- [ ] add stats enc?
- [ ] apply the new action log html to the modal
- [ ] add `<fivem://connect/xxxxx>` to `/status` by getting `web_baseUrl` maybe from the heartbeat
- [ ] add ban/whitelist fxs-side cache (last 1000 bans + 1000 whitelists), automatically updated
    - before starting the server, get last 1k bans/whitelists and write to a json file
    - quen monitor starts, it will read the file and load to memory
    - start sending the affected identifiers for the events `txAdmin:events:*` whitelisted, banned, and create a new for action revoked (type, action id).
    - monitor listens to the event, and when it happens either add it to the cache, or erase from cache
- [ ] add a commend system?
- [ ] add stopwatch (or something) to the db functions and print on `/diagnostics`

> Soon™® (hopefully in two months or so)
- [ ] tweak dashboard update checker behavior
- [ ] add an fxserver changelog page
- [ ] Social auth provider setup retry every 15 seconds
- [ ] show error when saving discord settings with wrong token
- [ ] break down `playerController` into separate files even more
- [ ] rename `playerController` to `playerManager`?

=======================================

## FXServer Stuff + TODOs

### Rate limiter
We could be more sensible when restarting the server and pushing an event to alert other resources that might want to auto block it.
```bat
netsh advfirewall firewall add rule name="txAdmin_block_XXXX" dir=in interface=any action=block remoteip=198.51.100.108/32
netsh advfirewall firewall show rule name="txAdmin_block_XXXX"
netsh advfirewall firewall delete rule name="txAdmin_block_XXXX"
```
https://github.com/citizenfx/fivem/search?q=KeyedRateLimiter


### Oversized resources streams
We could wait for the server to finish loading, as well as print in the interface somewhere an descending ordered list of large resource assets
https://github.com/citizenfx/fivem/blob/649dac8e9c9702cc3e293f8b6a48105a9378b3f5/code/components/citizen-server-impl/src/ResourceStreamComponent.cpp#L435


### Spectating with routing bucket:
Message from bubble:
> the obvious 'approach' works well enough:
> - get target routing bucket on server
> - save old source
> - teleport source player to in scope
> - send event to source client
> ------- client -------
> - set focus pos and vel, less shit than 'xd teleport' and should trip server to cull anyway
> - make self invisible/such
> - wait for target player to exist
> - use spectate native
> and when stopping spectating do the opposite of that



=======================================

## Bot Commands:
https://www.npmjs.com/package/eris - avarianknight recommended

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

=======================================

## Video tutorials
Requirements:
    - 2 non-rp recipes
    - Separate master actions page
### [OFFICIAL] How to make a FiveM Server tutorial 2021 for beginners!
Target: absolute beginners, barely have a vps
- Requirements:
    - Needs to be a VPS (show suggestion list)
    - OS: windows server 2016 or 2019 recommended
    - Hardware specs recommendation
    - Download Visual C++
    - You need a forum account (show page, don't go trough)
    - Create server key
    - Download xamp (explain most servers require, show heidisql page)
- Open firewall ports (show windows + OVH)
- Download artifact (show difference between latest and latest recommended)
- Set folder structure
- Run txAdmin (should open chrome, if it doesn't, then open manually)
- Open page outside VPS to show the ip:port thing
- Create master account
- Setup:
    - Present options
    - Run PlumeESX recipe
    - Master Actions -> Reset FXServer Settings
    - Setup local folder (show endpoint + server.cfg.txt errors)
- Show how to create admins
- Callout for advanced tutorial
### [OFFICIAL] How to update your FiveM Server tutorial 2021
Target: server owners that followed the stupid Jeva tutorial
- Why windows only
- Show current stupid folder structure
- Download artifact (show difference between latest and latest recommended)
- Set new folder structure
- Run txAdmin (should open chrome, if it doesn't, then open manually)
- Create master account
- Setup (show endpoint + server.cfg.txt errors)
- Show how to create admins
- Open firewall port 40120 (show windows + OVH)
- Callout for advanced tutorial
### [OFFICIAL] txAdmin v3 advanced guide 2021
Target: average txAdmin users
- creating admins
- multiple servers
- discord bot
- discord login
- database pruning 
- scheduled restarter

=======================================

## References

### CoreUI Stuff + Things I use
https://simplelineicons.github.io
https://coreui.io/demo/3.1.0/#icons/coreui-icons-free.html
https://coreui.io/demo/3.0.0/#colors.html
https://coreui.io/docs/content/typography/

https://www.npmjs.com/package/humanize-duration
https://kinark.github.io/Materialize-stepper/

https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes


=======================================

## CLTR+C+V
```json
{
    "interface": "192.168.0.123",
    "fxServerPort": 30120,
    "txAdminPort": 40120,
    "loginPageLogo": "https://github.com/tabarra/txAdmin/raw/master/docs/banner.png",
    "defaults": {
        "license": "cfxk_xxxxxxxxxxxxxxxxxxxx_xxxxx",
        "maxClients": 48,
        "mysqlHost": "xxxxxxxxxx",
        "mysqlUser": "xxxxxxxxxx",
        "mysqlPassword": "xxxxxxxxxx",
        "mysqlDatabase": "xxxxxxxxxx"
    },
    "customer": {
        "name": "tabarra",
        "password_hash": "$2y$12$WNuN6IxozL4CjgScsLvmGOmxtskg8EcPe67HtUw0ENeCCSaZ.z3AW"
    },

    "interface-": false,
    "loginPageLogo-": false,
    "customer-": false
}
```

```bash
# convars
+set txAdminVerbose true
+set txDebugPlayerlistGenerator true
+set txDebugPlayerlistGenerator true
+set txDebugExternalSource "x.x.x.x:30120"

# other stuff
export TXADMIN_DEFAULT_LICENSE="cfxk_xxxxxxxxxxxxxxxxxxxx_xxxxx"
npx depcheck
npm-upgrade
con_miniconChannels script:monitor*
+setr txAdmin-menuDebug true

# hang fxserver (runcode)
console.log('hanging the thread for 60s');
Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 60 * 1000);
console.log('done');

# check external chart
cdt
cd web/public/
curl -o svMain.json http://localhost:40120/chartData/svMain
```
