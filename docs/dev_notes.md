# FIXME: breaking changes
- didn't note anything before commit d2cfc42e5e0001afce6bafa17df4c7a9a6bbf42d
- playerBanned event lost the `target` prop
- changed warn ids prefix from A to W
- removed the option to import bans from other resources
- The optimizer will remove:
    - players that havent connected in 9 days and have less than two hours of playtime
    - wl requests and approvals older than a week
- cfx.re finally deprecated


# Coisas pra falar no trailer:
- playerlist mostra nomes limpos, e da match em caracteres (sem fuse.js ainda)
- players page mostra limpo, busca com fuse.js (not perfect)
- now we are saving old player identifiers

- whitelist in a separate page
- !addwl temporarily disabled
- explain the new flow
- show the buttons on the page, and search with fuse
- show settings page rejection messages config

- changed the way ban messages look + mostrar na tela

- new player modal
- you can now easily see if player is whitelisted, also the bans/warns
- you can now also revoke bans/warns directly into the modal

- new events for playerDirectMessage and actionRevoked
- updated lowdb to increase performance
- fixed memory leak for big servers
- dm via snackbar instead of chat

- removed the option to import bans from other resources
- The optimizer will remove:
    - players that havent connected in 9 days and have less than two hours of playtime
    - wl requests and approvals older than a week
- car boost option



# TODO:
- [x] player join/leave
- [x] increment player time
- [x] fix web playerlist
- [x] handle server restarts
- [x] send join/leave to log
- [x] resolve player function
- [x] update lowdb
- [x] make a backup before migrations
- [x] create database migration:
        - convert name -> displayName + pureName
        - create array for old identifiers
        - whitelist becomes a player prop, removes from actions
        - remove empty notes
- [x] get player modal (log, playerlist, db players page)
- [x] modal buttons:
    - [x] action details
    - [x] set note
    - [x] add/remove wl
    - [x] warn
    - [x] ban (also replace `txaDropIdentifiers` with `txAdmin:events:playerBanned`) (FIXME: close #625)
    - [x] dm (replace `txaSendDM` with event+snackbar)
    - [x] kick
    - [x] revoke action (+ actionRevoked event - PR #612)
- [x] db revoke_action/ban_ids routes + buttons on players page
- [x] whitelist page
- [x] join check + whitelist
- [x] whitelist page actions
    - [x] remove wl approval
    - [x] add wl approval
    - [x] approve wl request
    - [x] remove wl request
    - [x] search wl request
    - [x] wl request pagination
    - [x] wl request ignore all button
- [x] settings stuff
    - [x] add new custom connect reject messages for whitelist/bans
    - [x] remove minSessionTime from everywhere
    - [x] remove wipePendingWLOnStart from everywhere
    - [x] checar pra onde vai aquele refreshConfig que seta a convar de checkPlayerJoin?
    - [x] FIXME: settings > player manager > save is erroring out
    - [x] FIXME: diagnostics erroring out
- [x] cleanup
    - [x] remove all references to the old playerController
    - [x] clean PlayerDatabase file (mainly methods)
    - [x] tidy up the files, specially comments missing everywhere
- [x] migrate warn action id prefix from A to W
- [x] add database schema basic safeguards to player database
- [x] add fuse.js to players page search
- [x] test `adminVault.refreshOnlineAdmins()` 

- [x] FIXME: references to `playerlistManager.playerlist` or `playerlistManager.getPlayerList()` might want just the list of active players
- [x] FIXME: double check what happens when there is more than one player with the same license online
    - the scenario below also applies to two connected players with same license, the dbData will be out of sync, but i think it only applies to visible stuff in player modal like the notes, which may cause an overwrite
- [x] FIXME: dbData state issue when instantiating a DatabasePlayer while ServerPlayer exists for the same player.
    - consider scenario where the player is on the server, and you search for it on the playerlist
    - (also valid for player join check)
    - there will be 2 player.dbData, states that can be overwritten.
    - potential solution is to always prioritize ServerPlayer on player resolver
    - so even if no mutex/netid, if there is a ServerPlayer with the same license, return it instead of DatabasePlayer
    - maybe doesn't really matter?! maybe we just need to add a method to PlayerlistManager to notify when a player dbData was modified, and that would trigger `ServerPlayer.updateDbData()` or something like that?

- [x] modal should also return old ids in a separate prop only available for registered players
- [x] ban/warn all available identifiers
- [x] add last connection date to offline player modal (issue #689)
- [x] fix player modal in nui menu
    - [x] upper-level error handling
    - [x] actions tab
    - [x] ids tab
    - [x] history tab
    - [x] info tab
    - [x] ban tab

- [x] players page search by identifiers must also search for the new player.ids field
- [x] web: enable settign whitelist even with wl disabled + add warning to ban (nui only, i'll do web after)
- [x] migrate master action > database cleanup (specially case for removing older whitelists) 
- [x] remove master action > importing bans
- [x] create daily cron to optimize database:
    - [x] player rule: haven't connected in the past 9 days and had less than 2 hours of playtime.
    - [x] whitelistApprovals/whitelistRequests rule: older than 7 days


After merging feat/core-playerlist, but still in v5.0.0  (1d?):
- [x] deprecate cfx reverse proxy and remove `Cfx.re URL` from diagnostics.ejs
- [x] apply stashes
- [x] feat: add commonjs package.json to builds
- [x] fix translations:
    - [x] merge all translations
    - [x] `ban_messages.reject.*` to all translations (try to convert manually)
    - [x] `nui_menu.misc.directmessage_title`
    - [x] `player_modal.history.*` 
    - [x] `player_modal.ban.success / reason_required` 
    - [x] `player_modal.ids.*`
    - [x] `player_modal.info.*`
- [x] add car boost function

TODO for beta2:
- [x] merge taso PR
- [x] fix car boost func (double + veh type check)
- [x] fix csrf
- [x] force `txAdminAPI` to have `dataType: 'json'` for all calls
- [x] write changelog + announcement
- [x] announce to top servers

The diagnostics reporting button thing (2d?):
- [ ] do frontend button + modals
- [ ] FIXME: define steps


After v5.0.0 release:
- [ ] rename txAdmin Logs to System Logs (check chungus commands as well)
- [ ] server logger add events/min average
- [ ] add stats for HWID: `count, q1, q25, q50, q75, q99`. Result will only be valid for servers with netid over 1k but that's fine
- [ ] migrate `!addwl` make possible to `/addwl @mention`
- [ ] admin-only mode for the server
- [ ] add lru-cache to `DiscordBot.resolveMember()`
- [ ] bot status "watching xx/yy players"

- [ ] no duplicated id type in bans? preparing for the new db migration
- [ ] add a `Wait(0)` on `sv_main.lua` kick/ban handlers? (Issue #639)
- [ ] reorder `sv_main.lua` and add `local` prefix to most if not all functions
- [ ] create new whitelist events
    - [ ] whitelistPlayer:
        - license: xxxxx
        - author: admin name
        - status: true/false
    - [ ] whitelistPreApproval:
        - action: added/removed
        - identifier: `discord:xxxxxx` / `license:xxxxx`
        - author: admin name
    - [ ] whitelistRequest:
        - action: requested/approved/denied
        - author: either player name, or admin name
        - requestId: Rxxxx
        - license: xxxxxx
- [ ] mock out insights page (assets + http reqs)
- [ ] Melhorar ou remover mensagem `[txAdmin] You do not have at least 1 valid identifier. If you own this server, make sure sv_lan is disabled in your server.cfg`
- [ ] At the schedule restart input prompt, add a note saying what is the current server time
- [ ] `cfg cyclical 'exec' command detected to file` should be blocking instead of warning
- [ ] create events for dynamic scheduled restarts
- [ ] maybe some sort of lockfile to admins.json file which would disable admin manager?
- [ ] if you wait for the deployer to finish, and delete the server.cfg before pressing NEXT to go to the third step, does it show the no server.cfg message? shouldn't we adjust this message to tell the user that he probably deleted stuff?

Experiment: other than the color, on the perf chart we could draw likes for q50, q90, q99 tick times, maybe it's easier to understand

```json
[
    0.6303839732888147,
    0.1353923205342237,
    0.14006677796327213,
    0.09365609348914858,
    0.000333889816360601,
    0.0001669449081803005,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0
]
```


# REFACTOR DEV:

## Approve whitelist discord command set names:
- approve request with license+name but no discord: whitelistRequests.playerName
- approve request with license+name and discord: whitelistRequests.discordTag
- approve license: unknown
- approve mention: mentioned member tag



## New pages:
Overview:
- ???

Players:
- list of players in a table
- name + identifiers input
- auto search with debouncer

History:
- list of warns/bans in a table
- search by id OR identifier (single) with select box
- filter by action type
- filter by admin, and hotlink it from the admins page

Whitelist Page/routes:
- show pre approvals and requests in two tables
- Routes:
    - get returns
        - whitelistRequests[]
        - whitelistApprovals[]
    - whitelistApprovals (add/remove)
    - whitelistRequests (approve/deny)








----------------------------------------------------





teste:
    remover meu admin do sv zap
    dar join
    apertar f1 e ver se aparece a mensagem de perms



```js
//Resource didn't finish starting (if res boot still active)
`resource "${starting.startingResName}" failed to start within the [120~600]s time limit`

//Resources started, but no heartbeat whithin limit after that
`server failed to start within time limit - 30s after last resource started`

//No resource started starting, hb over limit
`server failed to start within time limit - ${this.hardConfigs.heartBeat.failLimit}s, no onResourceStarting received`

//Server started, but some time after it stopped replying http requests
//elapsedHealthCheck > this.hardConfigs.healthCheck.failLimit
'server partial hang detected'

//else
'server hang detected'
```

https://cs.github.com/?scopeName=All+repos&scope=&q=repo%3Avercel%2Fnext.js+%40next%2Fenv
https://github.com/vercel/next.js/blob/canary/packages/next-env/index.ts



Optional:
- [ ] fix cfx.re login match by admin id
- [ ] stats: add recipe name + if ptero + random collisions + how many scheduled restart times + drop zap/discord as login methods
- [ ] stats: jwe
- [ ] set nui/vite.config.ts > target > chrome103

## The Big Things before ts+react rewrite:
- [ ] in-core playerlist state tracking
- [ ] new proxy console util
- [ ] global socket.io connection for playerlist + async responses
- [ ] in-core resource state tracking
- [ ] new config (prepared for multiserver)
- [ ] multiserver tx instance (backend only)


## Console Rewrite
- [ ] Rewrite console logger module to be proxied to node:console
- [ ] Add `[OUTDATED]` as a clog header prefix 
- [ ] Move verbose to be part of the console (after the functional-ish change)
- [ ] Remove the GlobalData from a bunch of files which include it just because of verbosity
- [ ] Upgrade chalk, drop the chalk.keyword thing
- [ ] Search for `node:console`, as i'm using it everywhere to test stuff
- [ ] Migrate logger function to use the new logger component

```js
console.log('aaa', {àa:true});
const {Console} = require('node:console');
const ogConsole = new Console({
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


## New config
- do research, but i think we don't need any lib
- break up cfg files into `txData/<profile>/global.txcfg` and `txData/<profile>/server.txcfg`
- cfg file format is
    - trim every line
    - ignore empty lines or lines starting with // or # (may help people testing stuff, depends on file ext?)
    - `param_name=<json object>` (usually strings, but we could encode more complex data types if needed)
    - ignore with warning lines with invalid json objects
- parameters format suggestion: `playercontroller_onJoinCheckWhitelist` (?)
- REQUIRING stuff to ve on the config from the setup process is kinda bad (setupProfile.js), but might be good to check if the file is in there
- at boot, for every default config:
    - check if the cfg file overwrites it
    - check if an environment env overwrites it (case insensitive) then print warning (maybe not all vars, due to unauthorized GSPs)
- warn of any settings in the file that is not being used
- cfg vault has the defaults in the Zod format (for type safety) or simply
```js
const defaults = {
    playercontroller_onjoincheckwhitelist: {
        default: false,
        "accepted types or values??": "??"
    };
}
```
- maybe get rid of txAdmin.ts passing down specific cfgs, and pass txAdmin instance instead
- the modules can go `this.config.onJoinCheckWhitelist = txAdmin.cfgVault.configs.playercontroller_onJoinCheckWhitelist`
- careful because some will passs by value, some may pass as object reference therefore be live updated inside the module
- modules can do `txAdmin.cfgVault.subscribe(this.refreshConfig.bind(this), [...deps])`
- settings_get page reads from `txAdmin.cfgVault.configs`, so if a value was overwritten by proc.env, it will not cause confusion
- settings_save does `txAdmin.cfgVault.save([...])`
- use zod for validation https://www.npmjs.com/package/zod
- maybe even use zod's `.default()`?
- maybe components don't even need to hold a `this.config`? couldn't we just access it directly from the vault?
- need to keep in mind that many configs are used in the webroutes, so maybe just `txAdmin.config.xxx` and `ServerInstance.config.xxx`?
- 'convict' was the name of that one lib


### old settings refactor note:
- save only what changed
- make big settings a class (like TFR)
- settings.getConfig(); - returns the full config tree with unset props as null
- settings.get('object.dot.notation');
- settings.set('object.dot.notation');
- npm search for "object dot"



NOTE: https://github.com/sindresorhus/typescript-definition-style-guide

## Client game print issue
https://github.com/citizenfx/fivem/commit/cafd87148a9a47eb267c24c00ec15f96103d4257
https://github.com/citizenfx/fivem/commit/84f724ed04d07e0b3a765601ad19ce54412f135b


Up next-ish:
- [ ] Tooling:
    - [ ] Inline `.deploy.config.js > copy[]` into `main-builder.js`
    - [ ] Use `dotenv` or something to read FXServer's path from
    - [ ] Adapt `main-builder.js` to accept txAdmin convars
    - [ ] Update `development.md`
- [ ] checar se outros resources conseguem chamar 'txaLogger:menuEvent'?
- [ ] add ram usage to perf chart?
- [ ] wav for announcements
- [ ] Migrate all log routes
- [ ] Add download modal to log pages
- [ ] replace all fxRunner.srvCmd* and only expose:
    - sync fxRunner.srvRawCmd(string) - to be used by live console
    - async fxRunner.srvCmd(array, timeout) - to be awaited with the status response
- [ ] Quebrar snackbar de not admin em dois, um se confirmado que o problema são os identifiers, outro pra qualquer outro tipo de problema
- [ ] after menu client messages rework, add lua54


### Randoms:
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
    - será que o bubble já adicionou isso no fxserver? não faz parte das docs ainda (oct/2022)


### Server Insights page ideas:
- resource load times
- resource streamed assets
- http requests (grouped by resource, grouped by root domain or both?)
- performance chart with ram usage
- player count (loger window, maybe with some other data)
- top players? 
- map heatmap?!
- player disconnect reasons
- something with server log events like chat messages, kills, leave reasons, etc?


https://www.npmjs.com/search?q=effective%20domain
https://www.npmjs.com/package/parse-domain
https://www.npmjs.com/package/tldts

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
https://tanstack.com/virtual/v3

For the tx ingame menu, replace actions grid with flexbox
https://youtu.be/3elGSZSWTbM
around 12:00


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
- need to find a way to protect against scripts, cfg/console changing these aces
- would be cool to have a `SetProtectedMonitorAces(table)` native dedicated to txadmin to set every admin/resource ace perms


### txPointing (old txBanana)
- code prototype with ItsANoBrainer#1337
- keybind to toggle gun (grab or put away)
- when you point at player, show above head some info
- when you "shoot" it will open the player menu and hopefully fire a laser or something
- when you right click, slap player (ApplyDamageToPed 5 damage + small psysichs push up and x+y random)


### recipe engine todo:
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
nui_devtoold mpMenu

# hang fxserver (runcode)
console.log('hanging the thread for 60s');
Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 60 * 1000);
console.log('done');

# check external chart
cdt
cd web/public/
curl -o svMain.json http://localhost:40120/chartData/svMain
```
