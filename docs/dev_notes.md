# TODO: v7.0.0 Release
- [x] terminal: fix scroll to bottom not detecting scroll events
- [x] ~~make sure some user input based fields are truncated (admin/server/player name)~~ good enough
- [x] FIXME: console disable input if no write perms
    - do we need to check for view perms in the page itself or just the menu is enough?
- [x] FIXME: global settings not updating everywhere when saving settings
    - this means deprecating globals.config  in favor of globals.txAdmin.globalConfig
- [x] Remove old live console menu links
- [x] FIXME: server sidebar tooltips are under the terminal
- [x] FIXME: terminal not fitting correctly when zoom is not 100% and font size is not the default 16px
- [x] FIXME: toasts going forever or with undefined error if you run them fast
    - specifically can happen to the server restart button

- [x] zap hosting advertisement + discord link on login page
- [x] Add clear copyright/license notice at the bottom of the server sidebar?
- [ ] talk to r* and make sure the new build process wipes the old cache

- [x] deprecate StatisticsManager.pageViews as its now untrackable?
- [x] check all discord invites (use utm params maybe?)
- [x] onesync should be legacy by default

- [ ] fix issue where the forced password change on save reloads the page instead of moving to the identifiers tab
- [ ] easter egg with some old music? https://www.youtube.com/watch?v=nNoaXej0Jeg
- [ ] tutorial stepper for the new UI?
- [ ] update docs on development?

=======================================================================





wget $(curl -s https://api.github.com/repos/tabarra/txadmin/releases/latest | grep "browser_download_url.*monitor.zip" | cut -d '"' -f 4)

wget $(curl -s https://api.github.com/repos/tabarra/txadmin/releases/latest | jq -r '.assets[] | select(.name == "monitor.zip") | .browser_download_url')



=======================================================================

# TODO: v7.1+
- [ ] feat(menu): add keymapping for tp to waypoint (PR #886)
- [ ] fix(nui/PlayerModel): require OneSync for bring and goto (PR #851)
- [ ] Remove old live console legacy code
- [ ] can I remove `/nui/resetSession`? I think we don't even use cookies anymore
- [ ] fix the tsc build

- [ ] NEW PAGE: Dashboard
    - [ ] number callouts from legacy players page
    - [ ] warning for dev builds of txadmin
    - [ ] warning for top servers
- [ ] NEW PAGEs: Console log + Action log
- [ ] NEW PAGE: Players
- [ ] NEW PAGE: History

- [ ] console nav button to jump to server start or errors?
- [ ] cfg parser: resource relative read errors shouldn't trigger warnings
- [ ] check again for the need of lazy loading
- [ ] put in server name in the login page, to help lost admins notice they are in the wrong txAdmin


=======================================================================

### v7 Menus:
- Server:
    - Dashboard
    - Live Console
    - Resources
    - Server Log
    - CFG Editor
    - Advanced
- Global:
    - Players
    - History
    - Whitelist
    - Admins
    - Settings
    - System \/
        - Master Actions
        - Diagnostics
        - Console Log
        - Action Log
=======================================================================

This worked, no time to check which. 
Note it's in the core root and not in the `types` folder, also it has an `export` before the declaration.
```js
//file: core/global.d.ts
export declare global {
    const globals: any;
    namespace globalThis {
        interface Console {
            xxxx: any
        }
    }
    namespace NodeJS {
        interface Global {
            xxxx: any
        }
    }
    interface Console {
        exampleProperty: string;
    }
}
```

```js
import bytes from 'bytes';
import fs from 'node:fs';
const srcDb = 'E:\\FiveM\\txData\\default\\data\\playersDB.json';
const destFile = 'E:\\TMP\\deletar-referencias-tx\\playersDB.json'
const currRss = () => bytes(process.memoryUsage().rss);
import stream from 'stream';

import Chain from 'stream-chain';
import Disassembler from 'stream-json/Disassembler.js';
import Stringer from 'stream-json/Stringer.js';

export const saveToFileStreaming = (hugeArrayOfObjects: any) => {
    new Chain([
        stream.Readable.from(hugeArrayOfObjects, { objectMode: true }),
        new Disassembler(),
        new Stringer(),
        fs.createWriteStream(destFile)
    ])
}

setInterval(() => {
    console.log('.');
}, 100);

console.log('RSS before read:', currRss());
const dbo = JSON.parse(fs.readFileSync(srcDb, 'utf8'));
console.log('RSS after read:', currRss());
console.log('DB Players:', dbo.players.length);

console.log('Awaiting 30s...');
setTimeout(() => {
    console.log('RSS before write:', currRss());
    console.time('stringify+write');
    const dboString = JSON.stringify([dbo]);
    fs.writeFileSync(destFile, dboString);
    // saveToFileStreaming([dbo]);
    console.timeEnd('stringify+write');
    console.log('RSS after write:', currRss());
}, 30*1000);

//normal 202 -> 714mb, em 450ms
//lib 202 -> weird 1gb peak
```

=======================================================================

## src
- assets
- components
    - shadcn
        - ...components installed by shadcn cli - no touchy!
    - ...shared components
- pages
    - login
        - index.tsx (the actual page component)
        - ...whatever components are used just in the login page
    - dashboard
        - index.tsx (the actual page component)
        - PerformanceChart.tsx
        - PlayerChart.tsx
- layout
    - MainLayout.tsx
    - Header.tsx
    - LeftSidebar.tsx
    - RightSidebar.tsx
- hooks
- lib

### panel z-order
z-10    UI: server/playerlist asides
z-10    shadcn: NavigationMenu
z-20    UI: Header

z-10    Terminal: LiveConsoleSearchBar
z-10    Terminal "scroll to bottom" button
z-20    Terminal: "connecting" overlay

z-20    Terminal: LiveConsoleSaveSheet > SheetBackdrop
z-20    Terminal: LiveConsoleSaveSheet
--------------------------------------------
z-40    UI: WarningBar
z-40    UI: CustomToaster

z-50    shadcn: AlertDialogOverlay
z-50    shadcn: AlertDialogContent
z-50    shadcn: DialogOverlay
z-50    shadcn: DialogContent
z-50    shadcn: DropdownMenuContent
z-50    shadcn: SelectContent
z-50    shadcn: SheetOverlay
z-50    shadcn: SheetContent
z-50    shadcn: TooltipContent - doesnt go over the terminal?!

### Page Changes:
Players:
- list of players in a table
- name + identifiers input
- auto search with debouncer

History:
- list of warns/bans in a table
- search by id OR identifier (single) with select box
- filter by action type
- filter by admin ("self" must be an option), and hotlink it from the admins page

Whitelist:
- maybe remove the wl pending join table
- maybe make a "latest whitelists" showing both pending and members (query players + pending and join tables)
- don't forget to keep the "add approval" button

CFG Editor:
- multiple cfg editors
- add backup file to txdata, with the last 100 changes, name of the admin and timestamp

Setup:
- don't ask for server data location, list txData subfolders and let the user pick or specify
- don't ask for cfg location, assume server.cfg and let the user change

Master Actions:
- reset fxserver - becomes server add/remove/edit
- clean database - "bulk changes" button at the players page
- revoke whitelists - button to whitelist pages


=======================================================================

## Next Up
- [ ] Playerlist: implement basic tag system with filters, sorting and Fuse.js
    - the filter dropdown is written already, check `panel/src/layout/playerlistSidebar/Playerlist.tsx`
    - when filterString is present, disable the filter/sort drowdown, as it will show all results sorted by fuse.js
    - might be worth to debounce the search

- [ ] Anonymous admin actions (issue #893)
    - settings with select box for which options to choose (bans, warns, dms, kicks, restarts, announcements, everything)

- [ ] create new "Remove Player Data" permission which would allow to delete bans/warns, players and player identifiers

- [ ] maybe use [this lib](https://www.npmjs.com/package/ntp-time-sync) to check for clock skew so I can remove the complexity of dealing with possible desync between core and ui on player modal, scheduler, etc;

- [ ] write some automated tests for the auth logic and middlewares
    - https://youtu.be/bzXtYVH4WOg
- [ ] instead of showing cfg errors when trying to start server, just show "there are errors in your cfg file" and link the user to the cfg editor page
- [ ] fix the eslint config
- [ ] add fxserver version to txDiagnostics
- [ ] slide gesture to open/close the sidebars on mobile
- [ ] new restart schedule in status card

- [ ] ask framework owners to use `txAdmin-locale`

- [ ] redact discord api webhook urls from reports
- [ ] xxxxxx


### Linter notes
- Maybe prettier for all files except ts/js which could be in dprint
- Use the tailwind sorter plugin
- When running prettier, add ignore to the imported external files
https://prettier.io/docs/en/integrating-with-linters.html
https://tailwindcss.com/blog/automatic-class-sorting-with-prettier


### Improved scheduler precision
Talvez mudar a abordagem pra ser uma array e toda vez que a distância até o primeiro item for zero, executar a ação e dar um shift nos valores?
Exemplo:
```js
[
    {time: "12:00", temp: false, skipped: false},
    {time: "18:00", temp: false, skipped: false},
    {time: "22:00", temp: false, skipped: false},
]
```
Se a distância pro [0] for <= 0, executar restart e jogar o 12:00 pro final da array

```js
function scheduleNextExecution() {
  const now = new Date();
  const delay = 60 * 1000 - (now.getSeconds() * 1000 + now.getMilliseconds()) + 1000;

  setTimeout(() => {
    yourFunction(); // replace this with your function
    scheduleNextExecution();
  }, delay);
}

function yourFunction() {
  console.log('Function fired at', new Date());
}

scheduleNextExecution();

```
https://www.npmjs.com/search?q=timer
https://www.npmjs.com/search?ranking=popularity&q=scheduler
https://www.npmjs.com/package/node-schedule




### New UI stuff
https://www.tremor.so/blocks/landing-zone <<< boa inspiração de componentes
https://stacksorted.com/
https://auto-animate.formkit.com

maybe xtate for complex states like setup/deployer

outro video com template completo, sem  https://youtu.be/YVI-q3idGiM
https://immerjs.github.io/immer/ maybe?



#### Theming stuff:
https://palettte.app/
https://uicolors.app/create
https://www.tailwindshades.com/
https://contrast.tools/?tab=apca
https://atmos.style/contrast-checker
https://realtimecolors.com/
https://www.learnui.design/blog/color-in-ui-design-a-practical-framework.html
https://www.refactoringui.com/previews/building-your-color-palette
https://www.smashingmagazine.com/2021/07/hsl-colors-css/
Base for themes: https://daisyui.com/docs/themes/
Custom theme creator stuff:
- https://labs.mapbox.com/react-colorpickr/
- https://react-spectrum.adobe.com/react-spectrum/ColorSlider.html#creating-a-color-picker
- https://www.peko-step.com/en/tool/hslrgb_en.html
cfxui colors:
- ext/cfx-ui/src/cfx/apps/mpMenu/styles/themes/fivem-dark.scss
- ext/cfx-ui/src/cfx/styles/_ui.scss



### Zod error parsing
if (error instanceof z.ZodError) {
    const outString = error.issues.map(issue => {
        return issue.path.length
            ? `${issue.path.join('.')}: ${issue.message}`
            : issue.message;
    }).join('\n');
    console.error(outString);
    console.error(error.issues);
} else {
    console.dir(error);
}




### Tutorial discord bot:
- Make tutorial with excalidraw?!
- Parts:
    - 
- sometimes discord just bugs out, maybe kick the bot and invite him again
- also ctrl+r to reload discord
- tell them not to fuck up the placeholder
- tell them the http/https limitation




### Server resource scanner
ScanResourceRoot('E:/FiveM/txData/default.base/', (data: object) => {
    console.dir(data);
})


=======================================================================

Perf charts:

https://media.discordapp.net/attachments/1058975904811991080/1078919282924208238/image.png
https://media.discordapp.net/attachments/589106731376836608/1108806732991430736/image.png
https://media.discordapp.net/attachments/885648563105837116/1107449123881365565/image.png
https://media.discordapp.net/attachments/885648563105837116/1107446997369241600/image.png
https://cdn.discordapp.com/attachments/885648563105837116/1086875664432508968/image.png
https://media.discordapp.net/attachments/885648563105837116/1080548734292742214/SPOILER_image.png
https://media.discordapp.net/attachments/885648563105837116/1080493539374420049/image.png
https://media.discordapp.net/attachments/885648563105837116/1079422080820453397/image.png
https://media.discordapp.net/attachments/1044112583201927189/1109100201366528110/saS3WOdi.png
https://media.discordapp.net/attachments/885648563105837116/1079097577288499420/image.png
https://media.discordapp.net/attachments/885648563105837116/1059850236421492736/image.png
https://media.discordapp.net/attachments/881583434802294894/1109145714824597575/image.png

=======================================================================
> FIXME: chat doesn't build, possibly docker image issue
docker run \
  -p 40121:40120 \
  -p 30121:30120 -p 30121:30120/udp \
  --name fxstest \
  --volume "E:\\FiveM\\dockerFxserver":/fxserver \
  -it ubuntu bash

docker exec -it fxstest bash
apt update
apt install -y wget xz-utils nano iputils-ping bind9-host mycli

mycli -u root -h 172.17.0.2

cd /fxserver
wget https://runtime.fivem.net/artifacts/fivem/build_proot_linux/master/6427-843247aae475eb586950a706015e89033e01b3f4/fx.tar.xz
tar xvf fx.tar.xz

=======================================================================

(function() {
    var s = document.createElement('script');
    s.setAttribute('src', 'https://nthitz.github.io/turndownforwhatjs/tdfw.js');
    document.body.appendChild(s);
})()



=======================================================================



teste:
    remover meu admin do sv zap
    dar join
    apertar f1 e ver se aparece a mensagem de perms

# TODO: sooner than later
- [ ] Add a tracking for % of redm/fivem/libertym servers to txTracker
- [ ] maybe add some debug logging to `AdminVault.checkAdminsFile()`, to find out why so many people are having issues with their logins
    - maybe even add to the login failed page something like "admin file was reset or modified XXX time ago"
- [ ] Use q5/q95 from QuantileArrayOutput to help me define the buckets, then implement the join check time histogram
- [ ] server logger add events/min average
- [ ] no duplicated id type in bans? preparing for the new db migration
- [ ] `cfg cyclical 'exec' command detected to file` should be blocking instead of warning. Beware that this is not trivial without also turning missing exec target read error also being error
- [ ] maybe some sort of lockfile to admins.json file which would disable admin manager?





=======================================================================

> Maybe do this on the ban message page template
```css
background-image: url("https://i.imgur.com/5bFhvBv.png");
background-repeat: no-repeat;
background-position: right 15px bottom 15px;
```

```js
//Resource didn't finish starting (if res boot still active)
`resource "${starting.startingResName}" failed to start within the [120~600]s time limit`

//Resources started, but no heartbeat within limit after that
`server failed to start within time limit - 45s after last resource started`

//No resource started starting, hb over limit
`server failed to start within time limit - ${this.hardConfigs.heartBeat.failLimit}s, no onResourceStarting received`

//Server started, but some time after it stopped replying http requests
//elapsedHealthCheck > this.hardConfigs.healthCheck.failLimit
'server partial hang detected'

//else
'server hang detected'
```

=======================================================================

## New config
- july 2023: consider that some vars will be used in more than one component, so making them live in one or another might not be good
- the modules should be the ones to decide when they need to refreshConfig, so inside the module constructor maybe subscribe to change of specific variables, (in or outside of module). Maybe use event dispatchers?!

- early 2023: acho que os defaults deveriam existir dentro dos components
e sempre que outro componente precisar saber uma config, deve passar pelo componente
- need to have a version and have migration, like the database

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

https://cs.github.com/?scopeName=All+repos&scope=&q=repo%3Avercel%2Fnext.js+%40next%2Fenv
https://github.com/vercel/next.js/blob/canary/packages/next-env/index.ts



NOTE: https://github.com/sindresorhus/typescript-definition-style-guide

## Client game print issue
https://github.com/citizenfx/fivem/commit/cafd87148a9a47eb267c24c00ec15f96103d4257
https://github.com/citizenfx/fivem/commit/84f724ed04d07e0b3a765601ad19ce54412f135b


Up next-ish:
- [ ] Tooling:
    - [ ] Use `dotenv` or something to read FXServer's path from
    - [ ] Adapt `main-builder.js` to accept txAdmin convars
    - [ ] Update `development.md`
- [ ] checar se outros resources conseguem chamar 'txaLogger:menuEvent'?
- [ ] add ram usage to perf chart?
- [ ] Migrate all log routes
- [ ] Add download modal to log pages
- [ ] replace all fxRunner.srvCmd* and only expose:
    - sync fxRunner.srvRawCmd(string) - to be used by live console
    - async fxRunner.srvCmd(array, timeout) - to be awaited with the status response
- [ ] Quebrar snackbar de not admin em dois, um se confirmado que o problema são os identifiers, outro pra qualquer outro tipo de problema
- [ ] after menu client messages rework, add lua54
- [ ] add an fxserver changelog page
- [ ] check EOL and warn user - new Date('2021-09-14T07:38:51+00:00').getTime()
- [ ] maybe remove the sv_maxclients enforcement in the cfg file
- [ ] fix the interface enforcement without port being set as zap server?


### Randoms:
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
- biggest events, or resources kbps out? something to help see which resource is bottlenecking the network
    - apparently this can be done in scheduler quite easily by modifying the definition of `TriggerClientEvent`
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
- StatisticsManager

Questions:
- How to make the database interface (currently in playerController)
- Should break logger and config in 2 or work top->down?

march/2023 insight:
- if no `txData/config`
- move the profile config and data to txdata
- rename `txData/<profile>` to `txData/<profile>_bkp`
- at run time:
    - check if `txData/lock` exists
    - if it doesn't
        - save pid + interface + port to lock file
    - if it does
        - see if the pid is running
        - say "you cant run two tx on the same txdata, open <url> to visit the other one"


### Adaptive cards system
- Does not require the new ace system or the API
- Resources can register their adaptive cards interface which will show in the tx nui main tab, or as a player card tab
- The resources add a `ui_cards` definition to their `fxmanifest.lua` which is scanned by txadmin
- When an admin clicks on the button added, it will send a event through stdin to the tx resource which will verify caller and then call the resource export with the required context (eg. player id, admin name, etc). The exported function returns an adaptive card which is sent to txAdmin through fd3.
- This allows for resources to add their own UI to txAdmin, which supports buttons, inputs, etc
- cfx reference: `ext/cfx-ui/src/cfx/apps/mpMenu/parts/LegacyConnectingModal/AdaptiveCardPresenter/AdaptiveCardPresenter.tsx`

```lua
ui_cards 'list' {
    ['playerInfo'] = {
        title = 'RP Info',
        type = 'player', --show in player card
    },
    ['generalStatsNui'] = {
        title = 'RP Stats',
        type = 'mainmenu', --show in nui main menu
    },
    ['generalStatsWeb'] = {
        title = 'RP Stats',
        type = 'web', --show in the web panel
    },
}
```


### Update Event + Rollout strategy
This is not compatible with the update events.
If patch, show update notification immediately (especially important to quick-fix a bug).
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
NOTE: Dec/2023 - why even bother?! Current system works, and we can exports the player permissions via state bags or whatever

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
- code prototype with ItsANoBrainer#1337 (https://github.com/tabarra/txBanana)
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


## References

### CoreUI Stuff + Things I use
https://simplelineicons.github.io
https://coreui.io/demo/3.1.0/#icons/coreui-icons-free.html
https://coreui.io/demo/3.0.0/#colors.html
https://coreui.io/docs/content/typography/

https://www.npmjs.com/package/humanize-duration
https://kinark.github.io/Materialize-stepper/

https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes

### RedM stuff
https://github.com/femga/rdr3_discoveries
https://vespura.com/doc/natives/


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
con_miniconChannels script:runcode
+setr txAdmin-debugMode true
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
