## TODO v3
- [x] deployer: add download_github action
- [x] clean this file
- [x] deployer: add `github_download` action
- [x] deployer: add `load_vars`/`dump_vars` actions
- [x] deployer: add context variables to the `replace_string` action
- [x] deployer: add variable input stage
- [x] blur some inputs 
- [x] persist user oauth data and refresh it on social login
- [x] deployer: add a context var for the master admin identifiers
- [x] deployer: on download_github, first query to see which is the default branch
- [x] add tool to import ban from other databases
- [x] fix darkmode cookie path
- [x] upgrade packages
- [x] add option to backup (download) the database
- [x] add `joinCheckHistory` advanced action to dump `playerController.checkPlayerJoin()` attempts
- [x] add translation to the ban messages (kick/join)
- [x] handle non-ascii characters in the paths to prevent crash
- [x] add temporary workaround for yarn stdin issue
- [x] if deploy fails, add a `_DEPLOY_FAILED_DO_NOT_USE` file to deploy path
- [x] add $onesync directive to the deployer
- [x] update cfx default recipe
- [x] adapt setup page to handle different recipe engine versions + handle outdated state
- [x] fix console hidden x overflow
- [x] if profile !== default, say it on the navbar
- [x] improved (slightly) the behavior of the live console auto scroll
- [x] improve terminal onboarding? Nem que seja só um pouquinho...
- [x] test on linux
- [x] version bump

> Hopefully now:
- [ ] move the Monitor/Restarter tab in the settings page
- [ ] merge at least one PR
- [ ] update README
- [ ] maybe hardcode if(recipeName == plume) to open the readme in a new tab
- [ ] add new hardware bans
- [ ] make `playerController.writePending` prioritized (low 5s, medium 30s, high 60s)
- [ ] create `admin.useroptions` for dark mode, welcome modals and such
- [ ] remove the ForceFXServerPort config and do either via `server.cfg` comment, or execute `endpoint_add_tcp "127.0.0.1:random"`
- [ ] clean github Issues/PRs
- [ ] add discord group whitelist (whitelist switch becomes a select box that will enable guildID and roleID)
        ---- 2 opções: estar na guild ou ter role na guild
- [ ] persistent discord status message that is set up by `!setmessage`:
        - this will trigger a big status message to be sent in that channel
        - this message id can be stored in the config file
        - if discord id is present, use that instead of name (careful with the pings!)

> Soon™ (hopefully the next update)
- [ ] consolidate the log pages
- [ ] add stats enc?
- [ ] the Commands card in the dashboard is underused since resource commands are useless and nobody knows the kick all and broadcast options are there
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


## NUI commands
While the menu is open, show `ID | PlayerName` above nearby player heads.
The first thing selected is the tab selector, which can be operated using the arrows.
The Main menu will be fully arrow operated, but the player and txAdmin tab need to be mouse-operated

- Main Menu:
    - Teleport (submenu):
        - TP to coords (use regex)
        - TP to Marker
        - Send back (<name>) (me to my last, or player to his last)
    - Player mode (selector):
        - Nornal
        - NoClip/Invisible
        - God Mode
    - Heal Myself 
    - Spawn Car
    - Fix+Wash Car
    - Revive/Heal all players (temp)
    - Send Announcement (temp)
- Player Tab:
    - search box
    - sort options
    - player cards:
        - basic modal (DM, Warn, Kick, Ban)
        - Heal
        - TP Player to me
        - TP to Player
        - Spectate
- txAdmin Tab:
    - iframe containing txAdmin's web with some customizations:
        - menu starts collapsed
        - no logo/header
        - no footer

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

## Video tutorials
Requirements:
    - 2 non-rp recipes
    - Separate master actions page
#### [OFFICIAL] How to make a FiveM Server tutorial 2021 for beginners!
    Target: absolute beginners, barely have a vps
    - Requirements:
        - Needs to be a VPS
        - OS: windows server 2016 or 2019 recommended
        - Hardware specs recommendation
        - Download Visual C++
        - You need a forum account (show page, don't go trough)
        - Create server key
        - Download xamp (explain most servers require, show heidisql page)
    - Open firewall ports (show windows + OVH)
    - Download artifact (show difference between latest and latest recommended)
    - Set folder structure
    - Run txAdmin
    - Open page outside VPS to show the ip:port thing
    - Create master account
    - Setup:
        - Present options
        - Run PlumeESX recipe
        - Master Actions -> Reset FXServer Settings
        - Setup local folder (show endpoint + server.cfg.txt errors)
    - Show how to create admins
    - Callout for advanced tutorial
#### [OFFICIAL] How to update your FiveM Server tutorial 2021
    Target: server owners that followed the stupid Jeva tutorial
    - Why windows only
    - Show current stupid folder structure
    - Download artifact (show difference between latest and latest recommended)
    - Set new folder structure
    - Run txAdmin
    - Create master account
    - Setup (show endpoint + server.cfg.txt errors)
    - Show how to create admins
    - Open firewall port 40120 (show windows + OVH)
    - Callout for advanced tutorial
#### [OFFICIAL] txAdmin v3 advanced guide 2021
    Target: average txAdmin users
    - creating admins
    - multiple servers
    - discord bot
    - discord login
    - database pruning 
    - scheduled restarter

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
cd /e/FiveM/builds/3247/citizen/system_resources/monitor
nodemon +set txAdminFakePlayerlist yesplzx +set txAdminVerbose truex

# build
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

### the fun command thing
https://github.com/VenomXNL/XNLRideAnimals/blob/master/XNLRideAnimals/client.lua
https://docs.fivem.net/docs/game-references/ped-models/#animals
https://github.com/SFL-Master/Peds/blob/master/client/main.lua
https://forum.cfx.re/t/peds-attack-players/3467/4
https://forum.cfx.re/t/request-how-to-create-aggressive-npcs/583370
https://forum.cfx.re/t/i-want-to-make-a-spawned-npc-attack-players/462463


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
