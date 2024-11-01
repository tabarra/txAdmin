Legend:
- [ ] -> Not started
- [x] -> Completed
- [!] -> Release Blocker
- [?] -> Lower priority or pending investigation

## Previous bugs
- [ ] ctrl+f doesn't work in the player modal anymore, if on the player or history pages
    - criar um estado "any modal open" pra desabilitar todos hotkeys das páginas?

## Highlights
- [x] New player drops page
    - [ ] review page layout: 
        - [ ] make it less card-y
        - [ ] fix crashes table widening the outer shell - is it just the scroll?
        - [ ] fix crashes table is not responsive
        - [ ] fix scroll popping in/out
    - [ ] add drilldown interval buttons
- Dashboard stuff:
    - [ ] add testing for getServerStatsData
    - [ ] warning for top servers
    - full perf chart:
        - [ ] buttons to show memory usage, maybe hide player count
        - [ ] calculate initial zoom of 30h
            - Initial zoom code: https://observablehq.com/@d3/zoomable-area-chart?intent=fork
        - [ ] use semi-transparent arrows on the sides to indicate there is more to pan to when hovering
        - [ ] show server close reason
        - [ ] don't clear svg on render, use d3 joins
    - StatsManager.svRuntime:
        - [ ] write log optimizer and remove the webroute 30h filter
            - [ref](/core/modules/StatsManager/svRuntime/config.ts#L33)
            - maybe use rounded/aligned times?
            - check how this code works `d3.timeHours(new Date(1715741829000), new Date())[0]`
    - thread perf chart:
        - [ ] add the good/bad markers?
        - [ ] fix getMinTickIntervalMarker behavior when 0.2
            - maybe just check if it's the hardcoded or color everything blue
            - [ref](/core/modules/WebServer/wsRooms/dashboard.ts#L26)
        - [ ] color should change correctly at the min interval marker point
        - [ ] change the bg color to the color of the average ticket with heavy transparency?

## Small feat
- [ ] live console 
    - [ ] if socket connects but no data received, add a warning to the console and wipe it after first write
    - [ ] persistent cls via ts offsets
    - [ ] improve the bufferization to allow just loading most recent "block" and loading prev blocks via button
- [ ] 

## Database Changes
- [ ] migration to change "revocation" to optional
    - [ ] test the `getRegisteredActions()` filter as object, doing `{revocation: undefined}`
- [ ] add player name history
- [ ] add player session time tracking
    - [ref](/core/playerLogic/playerClasses.ts#L281)
    - [ ] create simple page to list top 100 players by playtime in the last 30d, 14d, 7d, yesterday, today
    - if storing in a linear UInt16Array, 100k players * 120d * 4bytes per date = 48mb

## Fixes
- [ ] fix double server boot message:
    - happens when some page starts the server and redirects you to the live console
    - you join the room and gets initial data (directly from logger)
    - while the websocket out buffer still haven't sent the boot message
- [ ] 

## Refactor + DX
- [x] deprecate fxRunner.srvCmd
    - deprecate liveConsoleCmdHandler 
    - turn srvCmd into sendRawCommand
    - use sendRawCommand in sendCommand (leave the fxserver.log*Command in sendRawCommand)
- [x] setup txData+profile on `index.js` before instantiating TxAdmin
- [x] process.exit reorg into lib/fatalError
- [x] move `ConfigVault.setupFolderStructure();` to index
- [x] improve db downgrade message
- [x] txGlobal.database.[players/actions/whitelist/cleanup].*
- [ ] txGlobal/globals
- [ ] do I need to import from `lodash-es`? What changed?
- [ ] lua file changes (after PR merges)
    - 4 spaces
    - Upper case for globals
    - alt+shift+f
    - `.git-blame-ignore-revs`
- [ ] .env
    - [x] convert builders to use txDevEnv
    - [x] convert tx code use txDevEnv
    - [ ] use chokidar on `scripts/build/dev.ts` to restart on `.env` changes
- [ ] drop usage of `const console = consoleFactory(modulename);`
    - instead do `const console = console.tag('xxxx')`
    - need to be careful with the import order, but it's possible
- [ ] headless deployer, without instantiating TxAdmin
- [ ] (?) resolve config on `index.js` before instantiating TxAdmin
- [ ] change the TxAdmin class to be the one managing the deployer, instead of the modules
- [ ] change the TxAdmin class to be the one exposing methods to get the status
    - possibilities: booting, noMaster, setup, deployer, ready
- [ ] include `list-dependencies.js` as part of the test workflow
    - improve to read the parent package deps
    - exit 1 on error
    - detect circular imports
- [ ] testing
    - use playwright
    - [ ] use https://mswjs.io/docs/getting-started
    - [ ] write some automated tests for the auth logic and middlewares

## Chores + boring stuff
- [ ] switch to `game 'common'` and remove `rdr3_warning`
- [ ] add `.yarn.installed` to the dist? even in dev
- [ ] check netid uint16 overflow
    - right now the `mutex#netid` is being calculated on [logger](/core/modules/Logger/handlers/server.js#L148)
    - detect netid rollover and set some flag to add some identifiable prefix to the mutex?
    - increase mutex to 6 digits?
    - `/^(?<mutex>\w{5})#(?<netid>\d{1,6})(?:r(?<rollover>\d{1,3}))?$/`
    - write parser, which will return the groups, defaulting rollover to 0
- [ ] check if it makes sense to allow the txAdmin thread to run more than every 50ms
    - node 22 branch -> code/components/citizen-server-monitor/src/MonitorInstance.cpp:307
- [ ] see if it's a good idea to replace `getHostStats.js` with si.osInfo()
    - same for getting process load, instead of fixing the wmic issue


## other stuff
- Consider using Blob
    - https://developer.mozilla.org/en-US/docs/Web/API/Blob
    - https://chatgpt.com/c/670bf1f6-8ee4-8001-a731-3a219266d4c1


## Refactor: Instantiation + Globals
Instantiate module without having txAdmin or globals:
NOTE: might not be worth doing this, as this is only to solve the problem of bad references, which is already being solved other ways.
- [!] WebServer(this, profileConfig.webServer);
    - context middleware factory requires reference to txadmin
    - same for websocket
- [ ] AdminVault();
- [ ] DiscordBot(this, profileConfig.discordBot);
- [ ] Logger(this, profileConfig.logger);
- [ ] Translator(this);
- [ ] FxRunner(this, profileConfig.fxRunner);
- [ ] DynamicAds();
- [ ] HealthMonitor(profileConfig.monitor);
- [ ] Scheduler(profileConfig.monitor);
- [ ] StatsManager(this);
- [ ] ResourcesManager();
- [ ] PlayerlistManager(this);
- [ ] PlayerDatabase(this, profileConfig.playerDatabase);
- [ ] PersistentCache(this);
- [ ] CfxUpdateChecker(this);


#### txGlobal todos
- [ ] remover `const globals: any;`
- [ ] remover todas as menções de `globals`
- [ ] checar por `globals?.`
- [ ] 
- [ ] 
- [ ] 


## Refactor: AdminVault
- Adminvault:
    - migrar admins.json
    - pra cada admin do admins.json
    - const admin = new StoredAdmin(rawObj)
    - 
- Middleware:
    storedAdmin.getAuthed(csrfToken): AuthedAdmin
- class AuthedAdmin extends StoredAdmin
    - has métodos to edit the admin



## Refactor: Web Route Validation
> validator, it will know if web or api to give the correct response type
> if invalid, it will send the response and return undefined
```ts
import { z, ZodSchema, infer as zodInfer } from "zod";
const checkParse = <T extends ZodSchema<any>>(
  schema: T,
  data: unknown
): zodInfer<T> | undefined => {
  const result = schema.safeParse(data);
  return result.success ? result.data : undefined;
};
const userSchema = z.object({
  name: z.string(),
  age: z.number(),
});
const data = { name: "Alice", age: 30 };
const result = checkParse(userSchema, data);
//    /\ Type: { name: string; age: number } | undefined

//Now, apply that to create something for the ctx
const params = ctx.getParams(schema: ZodInstance, errorMessage?: string)
if (!params) return;
```


## Refactor: New Config
- NOTE: check stash `refactor settings-modules`
- Save only what changed? Or save all in the settings page
- Do not make template config.json file on setup, only an empty-ish file
- Use dot notation, save it flat
- FIXME: not compatible with ban templates
    - perhaps use array format `banTemplates[0].id=...`
- Only acceptable values are json types except objects to prevent accidental mutations
- Maybe don't even json the file, make something closer to a `.env`, line separated
- Allow registerUpdateCallback to pass wildcards
    - https://www.npmjs.com/package/minimatch - used by node itself
    - https://www.npmjs.com/package/micromatch
    - https://www.npmjs.com/package/picomatch
    - https://www.npmjs.com/package/wildcard - super small
    - https://www.npmjs.com/package/matcher - super small
- Maybe components don't even need to hold a `this.config`? couldn't we just access it directly from the vault? Maybe something like `<globaltx>.config.get(key)`? Keep in mind some configs live in the scope of multiple modules.
- Config file definitely needs versioning and migrations

```ts
type RefreshConfigFunc = (newConfig: any, keysUpdated: string[]) => void

class ConfigVault /*does not extend TxModuleBase*/ {
    private readonly moduleRefreshCallbacks: {
        keys: string[],
        callback: RefreshConfigFunc
    }[] = [
        //NOTE: aqui os módulos _deveriam_ estar na ordem em que foram inicializados
    ];
    constructor() {}
    getConfigSaved(key: string) {
        //TODO: get the value that is saved in the config file
    }
    getConfigValue(key: string) {
        //TODO: get the value that is saved, or default if not saved
    }
    saveConfigBulk(changes: {[key: string]: any}) {
        //TODO: set multiple values in the config file
        this.processCallbacks(Object.keys(changes));
    }
    saveConfig(key: string, value: any) {
        //TODO: set the value in the config file
        this.processCallbacks([key]);
    }
    processCallbacks(updatedKeys: string[]) {
        for (const txModule of this.moduleRefreshCallbacks) {
            //TODO: check if keys match, allow wildcards
            const updatedMatchedKeys = updatedKeys.filter(k => txModule.keys.includes(k));
            txModule.callback({}, updatedMatchedKeys);
        }
    }
    registerUpdateCallback(keys: string[], callback: RefreshConfigFunc) {
        this.moduleRefreshCallbacks.push({ keys, callback });
    }
}
const configVault = new ConfigVault();

// For all modules to inherit from
class TxModuleBase {
    constructor(configKeys: any) {
        console.log('TxModuleBase constructor:', configKeys);
        configVault.registerUpdateCallback(['whatever.*'], this.refreshConfig.bind(this));
    }
    refreshConfig(newConfig: any, keysUpdated: string[]) {
        throw new Error(`refreshConfig not implemented`);
    }
}

class WebServer extends TxModuleBase {
    static readonly dependencies = ['WebPipe'];
    static readonly configKeys = [
        'xxxxx.*',
        'yyyyy',
    ];
    constructor(public runtime: any) {
        super(WebServer.configKeys);
        console.log('WebServer constructor:', this.constructor.name);
    }
    refreshConfig(newConfig: any, keysUpdated: string[]) {
        console.ok('passed', keysUpdated, this.runtime);
    }
}

new WebServer('runtimexxx');
console.dir(configVault.moduleRefreshCallbacks);
configVault.saveConfig('xxxxx.y', 123);
```


## Refactor: Formatting + Linting
- [ ] fix the eslint config + tailwind sort
        - [alternative](https://biomejs.dev/linter/rules/use-sorted-classes/)
        - search the notes below for "dprint" and "prettier"
        - check how the typescript repo uses dprint
        - use `.git-blame-ignore-revs`
- maybe biome?
- Maybe prettier for all files except ts/js which could be in dprint
- Use the tailwind sorter plugin
- When running prettier, add ignore to the imported external files
https://prettier.io/docs/en/integrating-with-linters.html
https://tailwindcss.com/blog/automatic-class-sorting-with-prettier



=======================================================================


## Next Up
- Kick as punishment might be needed since minimum ban is 1 hour, possible solutions:
    - Allow for ban minutes
    - Add a "timeout" button that brings a prompt with 1/5/15/30 mins buttons
    - Add a checkbox to the kick modal to mark it as a punishment

- [ ] add average session time tracking to statsManager.playerDrop

- [ ] locale file optimization - build 8201 and above
- [ ] easter egg???
    - some old music? https://www.youtube.com/watch?v=nNoaXej0Jeg
    - Having the menu protest when someone fixes their car too much in a short time span?
    - Zeus or crazy thunder effects when someone spams no clip?
    - Increasingly exciting 'tada' sounds when someone bans multiple people in a short time span? (ban 1: Ooh.. / ban 2: OOooh.. / ban 3: OOOOOHHH!)

- [ ] remove more pending DynamicNewBadge/DynamicNewItem (settings page as well)
- [ ] reevaluate globals?.tmpSetHbDataTracking
- [ ] fix socket.io multiple connections - start a single instance when page opens, commands to switch rooms
- [ ] evaluate and maybe add event bus
- [ ] switch tx to lua54

- [ ] build: generate fxmanifest files list dynamically
    - node 22 use fs.glob
- [ ] fix remaining imgur links
- [ ] update docs on development?
- [ ] rename to de-capitalize components files that have multiple exports 
- [ ] instead of showing cfg errors when trying to start server, just show "there are errors in your cfg file" and link the user to the cfg editor page
- [ ] break down the discord /info command in /info and /admininfo?
- [ ] enable nui strict mode
    - check if the menu -> tx -> iframe -> legacy iframe is not working
    - check both canary and prod builds

- [ ] use `ScanResourceRoot()`
    - `ScanResourceRoot('xxx/resources/', (data: object) => {...});`
- [ ] `2xl:mx-8` for all pages? (change on MainShell)
- [ ] console nav button to jump to server start or errors? 
    - Or maybe filter just error lines (with margin)
    - Or maybe even detect all channels and allow you to filter them, show dropdown sorted by frequency
- [ ] cfg parser: resource relative read errors shouldn't trigger warnings
- [ ] check again for the need of lazy loading
- [ ] put in server name in the login page, to help lost admins notice they are in the wrong txAdmin
- [ ] update stuff that requires WMIC to use PS command directly 
    - NOTE: perhaps just use `systeminformation.processLoad()` instead
    - issue: https://github.com/tabarra/txAdmin/issues/970#issuecomment-2308462733
    - new lib, same dev: https://www.npmjs.com/package/pidusage-gwmi
    - https://learn.microsoft.com/en-us/powershell/scripting/learn/ps101/07-working-with-wmi?view=powershell-7.2

- After Node 22:
    - check all `.npm-upgrade.json` for packages that can now be updated
    - Use `/^\p{RGI_Emoji}$/v` to detect emojis 
        - ref: https://v8.dev/features/regexp-v-flag
        - remove `unicode-emoji-json` from dependencies
        - update cleanPlayerNames
    - it will support native bindings, so this might work:
        - https://www.npmjs.com/package/fd-lock
    - change deployer and some other path manipulations to use `path.matchesGlob`
    - replace all `global.*` to `globalThis.*`

- [ ] checar se outros resources conseguem chamar 'txaLogger:menuEvent'?
- [ ] Migrate all log routes
- [ ] Add download modal to log pages

- [ ] Playerlist: implement basic tag system with filters, sorting and Fuse.js
    - the filter dropdown is written already, check `panel/src/layout/playerlistSidebar/Playerlist.tsx`
    - when filterString is present, disable the filter/sort drowdown, as it will show all results sorted by fuse.js
    - might be worth to debounce the search
    - add tags to the players page search box (separate dropdown?)
    - maybe https://shadcnui-expansions.typeart.cc/docs/multiple-selector

- [ ] create new "Remove Player Data" permission which would allow to delete bans/warns, players and player identifiers
    - Ref: https://github.com/tabarra/txAdmin/issues/751

- [ ] maybe use [this lib](https://www.npmjs.com/package/ntp-time-sync) to check for clock skew so I can remove the complexity of dealing with possible desync between core and ui on player modal, scheduler, etc;
    - even better: clients2.google.com/time/1/current
- [ ] slide gesture to open/close the sidebars on mobile
- [ ] new restart schedule in status card
- [ ] ask framework owners to use `txAdmin-locale`



=======================================================================


## Next Page Changes:
### CFG Editor:
- multiple cfg editors
- add backup file to txdata, with the last 100 changes, name of the admin and timestamp

### Setup:
- don't ask for server data location, list txData subfolders and let the user pick or specify
- don't ask for cfg location, assume server.cfg and let the user change

### Master Actions:
- reset fxserver - becomes server add/remove/edit, or just an option in settings -> fxserver
- clean database - "bulk changes" button at the players page
- revoke whitelists - button to whitelist pages

### Admin manager:
- stats on admins
    - total count of bans/warns
    - counts of bans/warns in the last 7, 14, 28d
    - revocation %
    - bans/warns %

### Resources:
- release v1:
    - should be stateful, with websocket
    - layout inspired in code editors
    - left sidebar with resource folders, no resources, with buttons to start/stop/restart/etc
    - search bar at the top, searches any folder, has filters
    - filters by default, running, stopped
    - main content will show the resources of the selected folder OR "recently added"
- release v2:
    - by default show only "recently added" resources
    - each resoruce need to have:
        - warning for outdated, button to update
        - warning for script errors
        - performance stats
        - option to add/remove from auto boot
        - option to auto restart on change (dev mode)
        - button to see related insights (http calls, events, etc?)

### Whitelist:
- remove the wl pending join table
- add a "latest whitelists" showing both pending and members (query players + pending and join tables)
- don't forget to keep the "add approval" button
- bulk actions button
    - bulk revoke whitelist

### Action Modal:
- feat requests:
    - be able to delete bans/warns with new permission (Issue #910)
    - top server asked for the option to edit ban duration (expire now / change)
    - Thought: need to add an edit log like the one we have for player notes
    - Thought: maybe we could use some dedicated icons for Expired, Edited, Revoked

### Server Insights page ideas:
- resource load times
- resource streamed assets
- biggest events, or resources kbps out? something to help see which resource is bottlenecking the network
    - apparently this can be done in scheduler quite easily by modifying the definition of `TriggerClientEvent`
- http requests (grouped by resource, grouped by root domain or both?)
    - https://publicsuffix.org/list/
    - https://www.npmjs.com/search?q=effective%20domain
    - https://www.npmjs.com/package/parse-domain
    - https://www.npmjs.com/package/tldts
- performance chart with ram usage
- player count (longer window, maybe with some other data)
    - show the player count at the peaks
- histogram of session time
- chart of new players per day
- top players? 
- map heatmap?!
- player disconnect reasons
- something with server log events like chat messages, kills, leave reasons, etc?
- we must find a way to show player turnover and retention, like % that come back, etc

=======================================================================



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

> user report
> canceled 18:00 for a 20:00 restart and it wont let me change to 20:00
problema: as vezes querem adiar um restart das settings, mas não é possível



=======================================================================

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


### New database alternatives:
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

ps.: need to also include the external events reporting thing


### Admin ACE sync:
NOTE: Dec/2023 - why even bother?! Current system works, and we can exports the player permissions via state bags or whatever

On server start, or admins permission change:
- write a `txData/<profile>/txAcePerms.cfg` with:
    - remove_ace/remove_principal to wipe old permissions (would need something like `remove_ace identifier.xxx:xx txadmin.* any`)
    - or just `remove_ace identifier.xxx:xx txadmin.*` which would remove all aces, for all subscopes
    - add_ace/add_principal for each admin
- stdin> `exec xxx.cfg; txaBroadcast xxxxx`

- We should be able to get rid of our menu state management, mainly the part that sends to lua what are the admin ids when something changes
To check of admin perm, just do `IsPlayerAceAllowed(src, 'txadmin.xxxxxx')`
> Don't use, but I'll leave it saved here: https://github.com/citizenfx/fivem/commit/fd3fae946163e8af472b7f739aed6f29eae8105f
- need to find a way to protect against scripts, cfg/console changing these aces
- would be cool to have a `SetProtectedMonitorAces(table)` native dedicated to txadmin to set every admin/resource ace perms

### Easy way of doing on/off duty scripts:
- NOTE: oct 2024 - the idea below changed a bit because of the initial player data, which should have the player admin status
- the current ones out there exist by abusing the auth event:
    - `TriggerEvent("txcl:setAdmin", false, false, "you are offduty")`
- provide an export to register a resource as a onduty validator
- when an auth sets place, reach out to the registered export to validate if someone should get the admin perms or not
    - if not, return an error message displaying a `[resource] <custom message>` as the fail reason
- provide an export to trigger the admin auth of any player
- provide an export to trigger a setAdmin removing the perms



### txBanana
- code prototype with ItsANoBrainer#1337 (https://github.com/tabarra/txBanana)
- keybind to toggle gun (grab or put away)
- when you point at player, show above head some info
- when you "shoot" it will open the player menu and hopefully fire a laser or something
- when you right click, slap player (ApplyDamageToPed 5 damage + small psysichs push up and x+y random)

NOTE: better to use some effect in game, it will likely sync between players
https://freesound.org/search/?q=toy+gun&f=&s=score+desc&advanced=0&g=1
https://freesound.org/browse/tags/laser/?page=5#sound
    https://freesound.org/people/nsstudios/sounds/344276/
    https://freesound.org/people/HadaHector/sounds/446383/
    https://freesound.org/people/unfa/sounds/193427/


=======================================


## References

### Locale
https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes

### RedM stuff
https://github.com/femga/rdr3_discoveries
https://vespura.com/doc/natives/

### Ptero stuff
https://github.com/pelican-eggs/games-standalone/blob/main/gta/fivem/egg-five-m.json
https://github.com/pelican-eggs/yolks/blob/master/oses/debian/Dockerfile
https://github.com/pelican-eggs/yolks/commit/57e3ef41ed05109f5e693d2e0d648cf4b161f72c


### New UI stuff
https://www.tremor.so/blocks/landing-zone <<< boa inspiração de componentes
https://stacksorted.com/
https://auto-animate.formkit.com

### Theming stuff:
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
# other stuff
npx knip
npm-upgrade
con_miniconChannels script:monitor*
con_miniconChannels script:runcode
+setr txAdmin-debugMode true
nui_devtools mpMenu
window.invokeNative('changeName', '\u{1160}\u{3164}');

# hang fxserver (runcode)
const duration = 60_000;
console.log(`hanging the thread for ${duration}ms`);
Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, duration);
console.log('done');

setInterval(() => {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2);
}, 0);

# stress http post
seq 50000 | parallel --max-args 0 --jobs 10000 "curl -s http://xxxxxxxxxxx:40120/ -d @braces768kb.json --header \"Content-Type: application/json\" > /dev/null"

# check external chart
cdt
cd web/public/
curl -o svMain.json http://localhost:40120/chartData/svMain
```
