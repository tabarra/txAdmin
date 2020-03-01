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


----------


## Interface Rework TODO:
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


----------


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
