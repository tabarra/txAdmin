> NOTE: this is really not that great of an history, it was very spotty before v2.0.0-conv

## Older TODO:
- [x] **Improve the README.**
- [x] Get the correct PID through pidtree (should we get only the correct fxserver's pid, or sum all the processes? This code usually takes about 40MB so it might be significant enough to include)
- [x] Put the configuration into a json and set default values
- [x] Write the admin log component (or part of another?)
- [x] Separate the web routes
- [x] **Add a simple rate limiter (MUST)**
- [x] Write some documentation
- [x] **Automatically check for updates (MUST)**
- [x] Auto restart on schedule (for the unstable servers out there)
- [x] Auto restart if the monitor fails X times in the last Y seconds 
- [x] Better error handling for the discord module
- [x] Add hitch detection
- [x] Add txAdmin_version fxserver svar
  
And more...
- [x] Console verbosity settings?
- [x] Fix what happens when you stop or start a server that is already running.
- [x] Add the config file to the arguments so we can run multiple servers in the same installation folder only be specifying it in runtime like `npm start server01.json`
- [x] Protect the log with password. For now I will just disable IP logging.
- [x] **Add discord integration**
- [x] Separate the DANGER ZONE commands into a separate tab with confirmation dialog?
- [x] Write a simple `manage_admins.js` script to help with the process. The current `/getHash?pwd=xxx` is counterintuitive at best.
- [x] Add machine performance data to the panel. Or not, perhaps that's a little too much into Grafana's land.
- [x] Configurable discord bot static responses. This should be a separate file like the admins one.
- [x] Improve fxRunner/actions responses. Currently it's only 'Done'.
- [x] Add a `more info` tab and include some config variables, and the complete PID breakdown
- [ ] FXServer artifact/build auto updater??? (rejected)
- [x] Automagically send messages in discord when starting/stopping/restarting the server
- [x] We have data, we should plot it into a graph...


## Interface Rework (around 0.9~1.0):
- [x] make 80% of all pages html/css (in php)
- [x] remake webUtils templating
- [x] port all pages to node
- [x] Complete full status page
- [x] Complete admin log page
- [x] Complete live console page
- [x] Fix login page + add username
- [x] Autenticate every console message
- [x] Fix xss from fxserver to browser
- [x] Implement 500ms buffer for the live console broadcast
- [x] Re-add login name to all logging functions
- [x] Clean webUtils
- [x] Adapt getStatus endpoint and integrate
- [x] Make dashboard functionalities work
- [x] Player modal endpoints
- [x] Execute cmd buffer modal
- [x] Code fxserver beta resource
- [x] Apply the new resource commands to the player modal
- [x] Server restart/stop ~~confirm modal~~ with kickall
- [x] Update available notice box (and move the checkUpdates method)
- [x] Make player history chart work
  
More:
- [x] escape message in txaBroadcast and txaSendDM
- [x] Rewrite readme with note about permission and the resource & trocar 'server' por 'server01'
- [x] Solve the FIXME: comments
- [x] ping padding only removing one 'x', fix the regex
- [x] add version o the page footer (txAdmin vXXX build with...)
- [x] write extensions 'soon' page
- [x] include the resource and related docs
- [x] bump version


## Settings Roadmap
> v1.0.5
- [x] adapt admin-add
- [x] adapt config-tester
- [x] adapt main
- [x] write setup
- [x] prevent starting with null as options
- [x] make settings page
- [x] create config vault component
- [x] settings page validate fxserver paths
- [x] settings page save the new settings
- [x] settings page for the other scopes
- [x] fxrunner detect the endpoint ports
- [x] rewrite README, Troubleshooting Guide
> v1.1.0
- [x] Make fxserver output buffer class and integrate
- [x] download server log button/endpoint
- [x] add buffer size to the dashboard
> v1.2.0
- [x] parse the schedule times
- [x] send message to chat
- [x] announcements channel in discord config page
- [x] announce discord autorestarts and when the server is started/restarted
> v1.3.0
- [x] create admin page template
- [x] use the admin data inside the template
- [x] admin add/edit/delete html/js/endpoints
> v1.4.0
- [x] create methods to evaluate permission and apply to all endpoints
- [x] write doc text for the permissions
> v1.5.0
- [x] resource injection
- [x] error handler to remove the old txAdminClient
> v1.6.0
- [x] temp intercom endpoint
- [x] make txAdminClient report it's alive
- [x] prevent auto restarter from killing a working server
- [x] normalize paths when saving the settings
> v1.7.0 BETA Release
- [ ] ???


## Around v1.12:
- [x] Do something in case fxserver's tcp/http endpoint dies for more than 5 minutes
- [x] Let admins change their password
- [x] Create a init.cfg for the fxserver to execute containing all txAdmin commands
- [x] Improve server log page 
- [x] Remove del in favour of fs-extra.emptyDir https://github.com/jprichardson/node-fs-extra/blob/master/docs/emptyDir.md
- [x] Remove figlet (also from the login page)
- [x] Remove pretty-ms
- [x] Improve CSS of the log pages on mobile, they look too tiny
- [x] freeze detector
- [x] inject via tmp file
- [x] experiements dropdown menu + ban page html/js
- [x] database module
- [x] functional ban page with ban add, list and export
- [x] ban feature at sv_main.lua
- [x] tie everything correctly and push update
- [x] fix playerlist div name issue
- [x] Fix paths with spaces (too hard, just block in the settings page)
- [x] Apple xss whitelist [] to all xss() calls (vide src\webroutes\diagnostics-log.js)


## TODO november, around v1.15:
- [x] Fix potential memory exhaustion DoS
- [x] Add Explosion type decoding
- [x] Add Custom logging method + docs
- [x] Diagnostics Page:
    - [x] Incompatible version warning
    - [x] Global crash counters + uptime
    - [x] If on Linux, correctly name the process as FXServer
- [x] Route Error Verbosity
- [x] Detect failed server launch
- [x] Move the start.bat file to the root dir
- [ ] Try the dark theme scss
- [ ] Make toggle button


## Timeline v2+
> Read this as a timeline, if it comes first, happened first.
> The Notes mark the milestones.
> I didn't keep track of what came before, but basically: new auth system, from express to koa

> v2.0.0-conv
- [x] why auto login when creating master doesn't work??
- [x] acessar /auth?logout da state mismatch
- [x] wrong ip, check x-forwarded-for
- [x] do I still need the clientCompatVersion convar? No
- [x] build path to the global info - check for globals.fxRunner.something
- [x] add txDataPath convar + docs
- [x] reorganize globals.info.xxx
- [x] remover messages.json temporariamente
- [x] add the stdout sniffer for wrong port and hangs (*must* be improved tho)
- [x] Fix bug: new profile > save global settings > reload page > fxserver: both will be undefined
- [x] clean this dumb file
- [x] perform end2end test
> v2.0.0-rc1
- [x] when you open the settings page, go directly to the fxserver tab
- [x] fix broken authorization
- [x] fix `run.cmd` compatibility with build 2270
- [x] increase ajax timeouts
- [x] disable resources page buttons when you don't have permission to use them
- [x] fix scrollbars and colors from the live console page
- [x] update packages - npm outdated
> v2.0.0-rc2
- [x] minor interface tweaks
- [x] improve responsivity on smaller monitors (between 1474 and 900 width)
- [x] clean custom.css an rename it to txAdmin.css
- [x] hide memory usage on linux?
- [x] change (fix?) cpu usage on diagnostics page
- [x] disable editing the master admin by other admins
- [x] join action/console log and protect with permission
- [x] end2end test + beta testers run
- [x] fix linux run.sh reference
- [x] update readme
> v2.0.0
- [x] improved docs and messages/strings
- [x] allow for admin names with 3 characters due to discourse rules
- [x] increased CitizenFX openid-client time skew tolerances to 2 hours 
> v2.0.1
- [x] improve user onboarding experience by adding an wizzard/stepper setup
- [x] fix arabic language and merge language PRs
- [x] add text-truncate (class) to playerlist
> v2.1.0
- [x] Remove maxsize for some Setup Wizard inputs
> v2.1.1
- [x] make player list dynamic and searchable
- [x] clean up the resource injector?
- [x] Rename basePath to serverDataPath
- [x] Change code exchange error messages
> v2.2.0
- [x] Rework the entire monitor
- [x] Change all the `monitor.statusServer` references
- [x] fix bug: resources page when you type then delete what you typed, it shows hidden default resources
> v2.3.0
- [x] fix /status showing objects instead of player count
- [x] fix playerlist not updating the ping colors
- [x] fixed double server spawning bug
> v2.3.1
- [x] rename `extensions` folder to `scripts` nad adjust webpack
- [x] upgrade packages (Note: discord.js v12 didn't work)
- [x] improved error handling for code exchange errors and increased timeout
- [x] create debug playerlist generator
- [x] created `globals.servicebus` to replace "temporary" variables
- [x] added FXServer update checker
- [x] improved monitor handling of very low-spec servers 
- [x] add greek + pt_pt
> v2.4.0
- [x] create `/advanced` page and move the verbosity switch there
- [x] fixed updateChecker error handling and added a message for pre-releases
> v2.4.1
- [x] create playerController module (started on v2.4.0)
- [x] fix escaping issues on commands.js
- [x] deprecate discord custom commands and set process priority features
- [x] remove the public ip setting and make the /status configurable
- [x] redact discord token from the settings page for admins with only "settings.view" permission
- [x] fix serverlist not wiping after server shutting down
- [x] update packages and change detection of clock skew
> v2.4.2
- [x] make the html of the new player modal
- [x] make the NUI of the warn message
- [x] code the modal actions (front+back+script+nui) for the online players
- [x] removed the `Admins file reloaded` spam from verbosity.
- [x] start the html of the new `/player/list` page
- [x] split `common.js` into separate files?
- [?] fix the double-player issue (timeout + fast rejoin?)
- [x] cleanup playerController for debug/testing stuff
- [x] add/test getRegisteredActions filters
- [x] replace `ansi-colors` with `chalk` since they fixed the performance issues
- [x] re-add playerConnecting the whitelist/ban checking function (lua+intercom+playerController)
- [x] implement whitelist registration logic
- [x] block html usage on admin kick reason 
- [x] prepare `/player/list` for a beta release with limited UX
- [x] check the time played algo, or the database saving - not working properly?
- [x] add playerName to ban/warn action db
- [x] create action for giving whitelist to a license (don't forget to set playerName)
- [x] link `/player/list` "accept wl" to actions endpoint
- [x] link `/player/list` "ban identifiers" to actions endpoint
- [x] link `/player/list` "revoke action" to actions endpoint
- [x] limit `/player/list` ui with permissions
- [x] make a settings tab for the player controller (dont forget to reset `checkPlayerJoin` convar!)
- [x] added flag to prevent noobs from running uncompiled version
- [x] added time-based deprecation warning
- [x] hide player search and tabs in the players page for now
- [x] add logging to the ban, warn and whitelist features
- [x] improve and localize ban rejection message
- [x] make it clear for the admin if ban/whitelist checking is disabled
- [x] review on every todohighlight keyword
- [x] update documentation
- [x] test on latest build
- [x] fix action div - revoke of action with no text looks bad
> v2.5.0
- [x] player page: fix ban ids permission
- [x] player page: add expiration note to the action history
- [x] ignore EPIPE koa errors
> v2.5.1
- [x] validate that min session time is valid
- [x] fix revoke button always visible
- [x] add player/action search feature
- [x] add search button for player modal
- [x] adapt all modal actions to offline players
- [x] change Server Log page to use the new modal
- [x] upgrade to Discord.js v12
- [x] upgrade to squirrelly 8 (omg why sooo hard???)
- [x] convert cl_logger.js to lua
- [x] set autostart as default, but only call spawnfunc if the cfg/data paths are set
- [x] improve input readability in low-contrast monitors (css tweak)
- [x] action revoking based on permission
- [x] give `manage.admins` permission to edit their social IDs
- [x] convert discordBot to use a commands folder
- [x] discord bot: add /addwl command
- [x] discord bot: change settings to accept prefix
- [x] remove html tags from kick messages (hopefully temporarily)
- [x] update dependencies
- [x] add stats endpoint
- [x] replace timestamp function in update checking
- [x] build test + version bump
> v2.6.0
- [x] discord bot: fixed bug of it accepting any prefix
- [x] discord bot: likely fixed multi-client issue
- [x] discord bot: re-add spam limiter
- [x] discord bot: add usage stats
- [x] add admins count to the stats.json
- [x] check for "stop monitor" in cfg file
> v2.6.1
- [x] update packages
- [x] discord bot: set new api url
- [x] reset /auth url after message or error
- [x] discord bot: fixed /help spam on reconnection
- [x] updated dutch, german, danish and czech languages
- [x] added option to disable in game restart warning chat messages (thanks @is-sam)
- [x] check why scheduled restarts are not kicking players (no issue found, still replaced `txaKickAll` eith `quit`)
- [x] use the new fd3 stream (added on 2427, ask ferrum before dropping support for older fxserver)
- [x] fix login page centralization on mobile screens
- [x] add placeholders to discord bot settings tab
- [x] update onesync setting values to reflect fxserver's change
- [x] if clean install and on windows, open the listening URL on the browser
> v2.7.0
- [x] fix player manager settigns page not saving
- [x] fix squirrelly filters not working on v8.0.4
> v2.7.1
- [x] increase default cooldown to 90s and limit the monitor.timeout option
- [x] improve some text and error messages
- [x] added open graph to the login page (thanks @PLOKMJNB)
- [x] improved live console page with server restart button and visual command history (thanks @Zeemahh) 
- [x] added custom ban times option (thanks @Zeemahh) 
- [x] update packages
- [x] increase CitizenFX session to 24 hours 
- [x] add http requests/minute counter to the diagnostics page
- [x] check ban/wl checking logic to make sure its resilient against unexpected identifiers
- [x] reduce svg icons file size to prevent loading issues
- [x] check why 16 is the last HB, and make sure this is correct
- [x] add FD3 heartbeat as redundancy + stats
- [x] live console: added command history to local storage
> v2.7.2
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
> v3.0.2
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
> v3.1.0
- [x] update README
- [x] added option to configure the scheduled restart warning times (merge PR#226)
- [x] move the Monitor/Restarter tab in the settings page
- [x] clean github Issues
- [x] replace `clone` with `lodash/cloneDeep`
- [x] refactor dashboard in preparation to the chart
- [x] remove many monitor settings since they were being misused and were never useful
- [x] replace ping with player ID on sidebar
- [x] updated packages
- [x] start collecting `/perf/` metrics
- [x] add performance chart to dashboard
- [x] set darkmode as default
- [x] compile test on latest, reset timer, version bump
> v3.2.0
- [x] fixed perf chart time labels
> v3.2.1
- [x] fixed perf chart URL
> v3.2.2
- [x] made the chart resposive
- [x] made the chart player count more consistent
- [x] reverted dark mode as default
> v3.2.3
- [x] perf chart: increase chart to 30 hours (360 snaps) 
- [x] perf chart: changed color scheme
- [x] perf chart: change padding
- [x] perf chart: added server reset lines
- [x] merge some prs (language, redm, minor)
- [x] add koa sessions and server log to the diagnostics page
> v3.3.0
- [x] change chart awaiting data message
- [x] check if the "custom template" was modified at all
- [x] add master username to the `{{addPrincipalsMaster}}` `server.cfg` placeholder to prevent confusion
- [x] validate if the database config is working before running the deployer
- [x] preventing VPS lag / DDoS to cause server restarts, and add freeze stats for the diagnostics page
- [x] update packages
- [x] setup: add automatic config file suggestion, with wrong extension check
- [x] simplify the start messages
- [x] test on latest + version bump
> v3.4.0
- [x] fix whitelist sorting order in the players page
- [x] updated packages
- [x] convert the logger to lua and use fd3 (thanks @AvarianKnight)
- [x] increased chart performance by 60%
- [x] settings/save/monitor: fixed schedules restart times validation
- [x] cfg editor: save on ctrl+s
- [x] zap: Disable "Slow" label when vCore count >= 8;
- [x] zap: On txAdmin boot, read then erase `txData/txAdminZapConfig.json`;
- [x] zap: Login page logo url from the config file (the 5% chance matrix easter egg won't be affected);
- [x] zap: Preset txAdmin interface/port;
- [x] zap: Enforce server.cfg endpoints;
- [x] zap: Make server deployer preset `server.cfg` endpoints. (unplanned)
- [x] zap: Database and license autofill in the deployer - the user can change it if they want;
- [x] zap: Master account automatically set on startup or first start;
- [x] zap: Add txData path warnings;
- [x] zap: Add `sv_maxClients` enforcement;
- [x] zap: One-click-login button via JWT/JWT (and documment it); 
- [x] zap: increase `txAdminVersionBestBy` by 10d when running in zap;
- [x] zap: Ad placement on login page, main interface (desk/mobile), and home-hosting warning (CLI);
- [x] make chart available without auth (since its public info anyways) and add thread filter
> v3.5.0
- [x] fix discord bot for guilds with stage channels
- [x] on windows, always open the web page on boot
- [x] allow 3 chars admin names
- [x] disable server auto-start when no admins configured
- [x] login page indicate if the `admins.json` file is not found
> v3.6.0~v3.6.4 (cicd issues)
- [x] added italian locale
- [x] solve the invalid session issue
- [x] dashboard: add selector for the thread and make it auto refresh
- [x] massive linting!
- [x] hot-patch for the unicode in ansi fxmanifest issue
- [x] added events for kick, warns, bans and whitelists (@TasoOneAsia)
> v3.7.0
- [x] remove hitch detector entirely
- [x] improve crash detection, increase limit from 30s to 60s, printing thread stack
- [x] add new monitor data to diagnostics and improve stats
- [x] fix the "change-me" server name when using deployer
- [x] rename authenticator to adminVault
- [x] update custom locale location + docs
- [x] break `playerController` database stuff to another file
- [x] make database save on timer tiers
- [x] make warns revokable
- [x] create auto backup/restore of the database
- [x] make quiet mode default on windows
- [x] remove the discord login option
- [x] version bump
> v3.8.0
- [x] fixed perf chart labels
- [x] reorganize web js files
- [x] remove all `var` from web and core
- [x] core: optimize host stats collection
- [x] web: prepare html/js for nui mode (remove elements)
- [X] web: create `txAdminAPI` and replace all `$.ajax`
- [x] increase page timeouts
- [x] change webserver token every time the server starts
- [x] ADDED MENU, TOO MANY CHANGES TO KEEP TRACK
> v4.0.0
- [x] fixed menu not working due to unreplicated convar at first tick
> v4.0.0
- [x] Fixed OneSync Legacy issues;
- [x] Fixed Focus issues (No more bugs with chat, vMenu, etc);
- [x] Fixed NoClip on vehicle causing physics collision to break;
- [x] Fixed escape/backspace not closing menu;
- [x] Fixed an issue that broke restart/stop the server, as well as whitelist players on in-game txAdmin page;
- [x] Many player modal issues solved (notes, styling, data displayed, etc).
- [x] Enabled Live Console for the in-game page;
- [x] Added a spectate action to the player modal (requires the new player.spectate permission);
- [x] Added option to see Player IDs;
- [x] Improved the vehicle spawn handling of car occupants;
- [x] Added the convars txAdminMenu-updateInterval and txAdminMenu-pageKey, as well as the command /txAdmin-debug. Please read the docs for more information.
- [x] ctxUtils: centralize basic render vars
> v4.1.0
- [x] updated turkish, lithuanian, italian
- [x] Added troll actions (weed/drunk/fire/wild attack)
- [x] Added button to copy current coords
- [x] Fixed player ban not working in the menu
- [x] lua small fixes
  - fix sv_menu sub name error
  - fix sv_logger explosion source
  - remove spectate keybind
- [x] add logging and confirmation snackbars to troll actions
- [x] menu: fix zap auth
- [x] fix old admins.json breaking on the identifiers validation
- [x] revert: don't open url when admins are configured
> v4.2.0
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
- [x] fixed: actions executing twice caused by build issues and fxmanifest globbing (eg spawning two cars);
- [x] fixed: teleporting under the ground;
- [x] fixed: noclip camera going crazy when using kashacters;
- [x] fixed: holding enter would execute the same action multiple times;
- [x] added heading to the copy coords command;
- [x] added keybind for NoClip (in FiveM settings);
- [x] added visual indication of which options you do not have permission for;
- [x] improved error handling on the player's modal;
- [x] many small fixed and tweaks, as well as package updates.
> v4.4.0
- [x] tweak(menu): added weird padding for version tag
- [x] fix(menu/lua): fixed noclip toggle permission
- [x] tweak(menu): temporarily disabled locale, again
> v4.4.1
- [x] fixed diagnostics page not rendering in some pages;
- [x] added "clear area" command (for now, doesn't clear server-spawned entities);
- [x] possibly fixed the menu playerlist sync issues;
- [x] a few small fixes and tweaks.
> v4.4.2
- [x] changed onesync to be "on" by default
- [x] noclip: update heading automatically + optimization
- [x] tweak: error logging stuff
- [x] feat: chart data rate limit
- [x] feat(web/diagnostics): redacting cfx/steam/tebex keys
- [x] feat: prevent noobs from messing setup/deploy opts
- [x] tweak(core): removed space checking in fx paths
- [x] fix(menu/spectate): fix for audio / texture loss when spectating a moving player 
- [x] feat: allow two tx on same browser (closes #395)
- [x] fix(client/state): fix not properly checking for netId existing, closes #443
- [x] feat(menu/main): delete vehicle sub option
- [x] fix(core): memory leak on server log 
- [x] fix(nui): auth source for zap servers
- [x] chore: updated a few dependencies
> v4.5.0
- [x] potentially fixed spectate black screen
- [x] added player freeze option
- [x] added option for right align of the menu
- [x] removed ip logging
- [x] fixed persistent focus after menu close by /tx
- [x] fixed spectate with wrong scaleform instructions after noclip
- [x] fixed noclip moving player back
- [x] added announcement button to console page (#403)
- [x] fix cause of death being always suicide (commit 9434d427)
- [x] update material ui to v5
- [x] fix(core): removed ansi color escape from srvCmdBuffer
- [x] new server log with pagination and filter
- [x] document new log thing
- [x] clean this file
- [x] update dev env to fxs/node16 
- [x] update packages & test
- [x] feat: database management page
- [x] fix logging data on diagnostics page
- [x] fix dashboard stats not working on iframe mode (closes #438)
- [x] fix player modal for new server log
> v4.6.0
- [x] rolled back fs-extra to v9.1.0
> v4.6.1
- [x] fixed text visibility on light theme
- [x] fixed wrong freeze yourself message
- [x] allow removal of revoked warns
- [x] fixed chat suggestions not working
- [x] spectate and freeze not showing in log
- [x] improved action logging names + reorder
- [x] fixed placeholder recipe detection
- [x] menu: new playerlist
- [x] properly handle freezing peds in vehicles
- [x] fix(scripts/spectate): handling for primary routing buckets not being 0
- [x] fix(deployer): changed zip library to solve errors
- [x] chore: updated some packages
> v4.7.0
- [x] fix(menu/players-page): fix sorting unknown distances higher than known
- [x] tweak(menu/players-page): reflect players low health with color change
- [x] fix(scripts/player-list): normalize health to percentage
- [x] Remove the "NEW" tag from `header.html` and `masterActions.html`
- [x] Implement new menu auth method
- [x] Add keybind for opening players page
- [x] Add keybind for toggling player IDs
- [x] Fix menu healthbar colors
- [x] Enable custom locale for menu
- [x] Reorganize menu buttons.
- [x] Reorganize all translation keys
- [x] Migrate warn to use the event + react translation
- [x] Solve sticky cookie after reauth issue
- [x] Fix the manage admins perm issue
- [x] Update packages
- [x] Test new NUI Auth on ZAP server
> v4.8.0

------------------------------
> NOTE: this was an attempt to get the help from the community around september 2019
### Feature tasks for collaborators:
- Logger:
    - [-] Revert txAdminClient cl_logger.js back into lua and fix the mismatch of killer ID from client to server
    - [ ] Listen for the most common vRP and ESX server events and log them
    - [x] Divide the interface vertically, and on the right add filter options (HTML/CSS Only)
    - [ ] Make the javascript for hiding events based on the `data-event-type` attribute
    - [.] Create a "load more" at the top of the log, for the admin too be able to see older entries.
- [x] When restarting the server, add the name of the admin to the chat/discord messages.
- [x] When sending a DM as admin, add the name of the admin
- [x] Add localized uptime to the /status command and review the usage of the dateformat lib
- [x] Add to the resources page an option to see/hide the default cfx resources
- [ ] Dark Theme!

x = done
- = being worked on
. = on hold
