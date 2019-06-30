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

---


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
