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


## TODO v2
> didn't keep track of what came before, but basically: new auth system, from express to koa
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
