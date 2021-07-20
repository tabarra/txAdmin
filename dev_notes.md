## TODO:
- [x] fix(menu): Disable all files if convar isn't set
- [x] refactor(scripts/menu): Break cl_main into several files
- [x] feat(menu/announce): Dynamic announce duration based on length
- [x] fix(menu): Fix race condition between NUI and scripts for ServerCtx
- [x] fix(menu/main): Disable vehicle spawning if OneSync is off
- [x] fix(menu/modal): fix permanent ban not working
- [x] fix(scripts/menu): Fix NoClip setting disable game controls override
- [x] fix: accept the new license format 
- [x] diagnostics: use `globals.monitor.hostStats` instead of `systeminformation`
- [x] many small fixes and tweaks
> v4.3.0
- [x] menu: fixed announcements duration
- [x] menu: changed playermode snackbar to center
> v4.3.1
- [ ] menu: sync playerlist via http
- [ ] menu: make `/tx` print useful information (eg menu disabled, auth fail reason, etc)
- [ ] menu: make txadmin-reauth more useful
- [ ] login page auto retry auth one time
- [ ] menu: fix player modal not handling `logout: true` (look for fetchWebPipe)

warn auto dismiss 15s
FreezeEntityPosition need to get the veh
debugModeEnabled and isMenuDebug are redundant, should probably just use the one from shared
https://i.imgur.com/PiqM8Nq.png


Test:
adm-zip
https://github.com/cthackers/adm-zip/compare/3d8bfc7a86da066131b2208a77148d2970e6234f...9a1ca460e18af17849542c6c136bd0c5861029f7

Meh:
windows/linux detection
sessions in general
nui snackbars
oauth login
socket.io
fd3




nota:
- precisamos garantir que uma sessão criada via NUI seja só usada com nui
- criar um novo token, mudar no primeiro tick
- desabilitar master actions pra quando for NUI


Small Stuff:
- [ ] menu: add debouncer for main options keydown
- [ ] menu: noclip should set ped heading when exiting freecam
- [ ] menu: visually disable options when no permission
- [ ] menu: fix heal self/server behavior inconsistent with player mode and teleport
- [ ] menu: add noclip key binding
- [ ] block execution if GetCurrentResourceName() != 'monitor'
- [ ] player modal should show if the user is banned/whitelisted or not, and an easy way to revoke it
- [ ] check EOL and warn user - new Date('2021-09-14T07:38:51+00:00').getTime()
- [ ] on recipe import, check if indexOf('<html>')
- [ ] enable squirrelly file caching via `renderFile()`
- [ ] srvCmdBuffer needs to strip the color escape characters
- [ ] logger: `Unrecognized event: playerJoining` -- we are using playerConnecting but should probably change that
- [ ] make the commands (kick, warn, etc) return success or danger, then edit DialogActionView.tsx
    - can be done by adding a randid to the command, then making the cmdBuffer match for `<id><OK|NOK>` 

- [ ] break `playerController` actions stuff to another file
- [ ] if isZapHosting && forceInterface, add `set sv_listingIPOverride "xxx.xxx.xxx.xxx"` in deployer
- [ ] maybe remove the sv_maxclients enforcement in the cfg file
- [ ] fix the interface enforcement without port being set as zap server?
- [ ] consolidate the log pages


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
- [ ] remove the ForceFXServerPort config and do either via `server.cfg` comment, or execute `endpoint_add_tcp "127.0.0.1:random"`
- [ ] create `admin.useroptions` for dark mode, welcome modals and such

> Soon™ (hopefully the next update)
- [ ] get all functions from `web\public\js\txadmin\players.js` and wrap in some object.
- [ ] maybe hardcode if(recipeName == plume) to open the readme in a new tab
- [ ] add new hardware bans
- [ ] add stats enc?
- [ ] apply the new action log html to the modal
- [ ] add `<fivem://connect/xxxxx>` to `/status` by getting `web_baseUrl` maybe from the heartbeat
- [ ] add ban server-side ban cache (last 500 bans?), updated on every ban change 
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

## Database Management page
- erase all whitelists
- erase all bans
- erase all warnings
- Prune Database:
    All options will be select boxes containing 3 options: none, conservative, aggressive
    - Players (without notes) innactive for xxx days: 60, 30
    - Warns older than xx days: 30, 7
    - Bans: revoked, revoked or expired
Add a note that to erase the entire database, the user should delete the `playersDB.json` (full path) file and restart txAdmin.
Pre calculate all counts

=======================================

## FXServer Stuff + TODOs

### Rate limiter
We could be more sensible when restarting the server and pushing an event to alert other resources thatm ight want to auto block it.
```bat
netsh advfirewall firewall add rule name="txAdmin_block_XXXX" dir=in interface=any action=block remoteip=198.51.100.108/32
netsh advfirewall firewall show rule name="txAdmin_block_XXXX"
netsh advfirewall firewall delete rule name="txAdmin_block_XXXX"
```
https://github.com/citizenfx/fivem/search?q=KeyedRateLimiter


### Oversized resources streams
We could wait for the server to finish loading, as well as print in the interface somewhere an descending ordered list of large resource assets
https://github.com/citizenfx/fivem/blob/649dac8e9c9702cc3e293f8b6a48105a9378b3f5/code/components/citizen-server-impl/src/ResourceStreamComponent.cpp#L435


### State bags?
https://docs.fivem.net/docs/scripting-manual/networking/state-bags/


### the ace permissions editor thing
https://discordapp.com/channels/192358910387159041/450373719974477835/724266730024861717
maybe playerConnecting and then set permission by ID?
https://github.com/citizenfx/fivem/commit/fd3fae946163e8af472b7f739aed6f29eae8105f


### Log Stuff:
https://www.npmjs.com/package/rotating-file-stream
https://www.npmjs.com/package/file-stream-rotator
https://www.npmjs.com/package/simple-node-logger
https://www.npmjs.com/package/infinite-scroll


### Git clone using isomorphic-git
https://github.com/isomorphic-git/isomorphic-git


### HWID tokens
https://github.com/citizenfx/fivem/commit/f52b4b994a316e1f89423b97c92d73b624bea731
```lua
local pid = 1
local hwids = {}
local max = GetNumPlayerTokens(pid)
for i = 0, max do
    hwids[i+1] = GetPlayerToken(pid, i)
end
print(json.encode(hwids))
```



=======================================

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

https://www.science.co.il/language/Locale-codes.php


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
# run
export CURR_FX_VERSION="3247"
alias cdmon="cd /e/FiveM/builds/$CURR_FX_VERSION/citizen/system_resources/monitor"

nodemon +set txAdminVerbose truex
nodemon +set txDebugPlayerlistGenerator truex +set txAdminVerbose truex
nodemon +set txDebugPlayerlistGenerator true +set txAdminRTS "deadbeef00deadbeef00deadbeef00deadbeef00deadbeef" +set txAdminVerbose truex
nodemon +set txDebugPlayerlistGenerator true +set txDebugExternalSource "x.x.x.x:30120" +set txAdminVerbose truex
npm run dev:menu:game

# build
rm -rf dist && npm run build && explorer dist
# fix this command later, the zip generated is too big and malformed
rm -rf dist && npm run build && tar.exe -cvf dist/monitor.zip dist/* && explorer dist

# other stuff
export TXADMIN_DEFAULT_LICENSE="cfxk_xxxxxxxxxxxxxxxxxxxx_xxxxx"
npm-upgrade
con_miniconChannels script:monitor*
+set svgui_disable true +setr txAdminMenu-debugMode true +setr txEnableMenuBeta true

# eslint stuff
npx eslint ./src/**
npx eslint ./src/** -f ./lint-formatter.js
npx eslint ./src/** --fix

# hang fxserver (runcode)
console.log('hanging the thread for 60s');
Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 60 * 1000);
console.log('done');
```
