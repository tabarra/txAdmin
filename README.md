<p align="center">
	<h1 align="center">
		FiveM-FXAdmin
	</h1>
	<h4 align="center">
		Join our Discord Server: &nbsp; <a href="https://discord.gg/f3TsfvD"><img src="https://discordapp.com/api/guilds/577993482761928734/widget.png?style=shield"></img></a> <br/>
		FiveM Forum thread: &nbsp; <a href="https://discord.gg/vFXqGXg"><img src="https://img.shields.io/badge/dynamic/json.svg?color=green&label=FXAdmin&query=views&suffix=%20views&url=https%3A%2F%2Fforum.fivem.net%2Ft%2F530475.json"></img></a>
	</h4>
</p>

<br/>

This is a very simple tool to help you Manage & Monitor your FiveM server remotely.  

## Features
- Start/Stop/Restart your server instance or resources
- Access control via multiple credentials and action logging
- Discord integration (for now, just the /status command)
- Monitor server’s CPU/RAM consumption
- Real-time playerlist with ping + steam-linked accounts (when available)
- OneSync Support (more than 32 slots server)
- Linux Support
- Live Console
- Auto Restart on failure detection
- Auto Restart on schedule
- Password brute-force protection


## Installation
First, make sure you have:
- NodeJS v10+ (If you have problems with node-gyp/bcrypt/discord.js try downgrading to Node v10 LTS)
- FXServer [(duh)](https://runtime.fivem.net/artifacts/fivem/)
- One TCP listen port opened for the web server
- Git (only for installs and updates)

To **INSTALL** FXAdmin execute:
```bash
$ git clone https://github.com/tabarra/fivem-fxadmin
$ cd fivem-fxadmin
$ npm i
```
Copy your `server-template.json` to `server.json` and modify it according to your preferences. The most important settings:  
- `global.fxServerPort` is your fxServer port as configured in your `server.cfg`.
- `monitor.restarter.schedule` is the restart schedule. The time MUST be in the 24-hour format with two digits for hours as well as minutes (`HH:MM`). Leave the array empty or set it to false to disable the feature.
- `fxRunner.buildPath` is the folder containing the files `run.cmd`, `fxserver.exe` and a bunch of DLLs in case of Windows, and only `run.sh` in case of Linux.
- `fxRunner.basePath` is the folder that **contains** the `resources` folder, usually it's here that you put your `server.cfg`.
- `fxRunner.cfgPath` is the absolute or relative path of your `server.cfg`.

Do the same thing to your `admins-template.json`.  
To generate the hashed password, you can use tools like [this](https://www.browserling.com/tools/bcrypt) and [this](https://bcrypt-generator.com) or even [this one](https://passwordhashing.com/BCrypt).  
  
To **RUN** FXAdmin execute:
```bash
$ npm start server.json
```

To **UPDATE** FXAdmin execute:
```bash
$ git pull
$ npm i
```

**Note:** You should run FXServer **through** FXAdmin, and not in parallel (ie in another terminal).  
**Note2:** When updating, make sure there's no differences in the json templates. If there is, copy the template and edit again.  
**Note3:** To configure your Discord bot, follow these two guides:  [Setting up a bot application](https://discordjs.guide/preparations/setting-up-a-bot-application.html) and [Adding your bot to servers](https://discordjs.guide/preparations/adding-your-bot-to-servers.html).  


## Troubleshooting
- If you run into problems when executing `npm install`, try `npm i node-gyp` or `npm i --global --production windows-build-tools` if you are on Windows. If that doesn't work, make sure you are using Node v10 LTS.
- If you are getting `HealthCheck request error: ` it means the FXAdmin:Monitor could not connect to the FXServer. Check the two items below.
- If the server is actually online but FXAdmin thinks it's offline, make sure your fxserver is configured to use the IP `0.0.0.0` in your `endpoint_add_*` directives instead of your public/private IP. Also check for your `global.fxServerPort` configuration, it must match the port configured in your `server.cfg`.
- If you are having trouble starting the FXServer via FXAdmin, run `npm run test-config server.json` and see which test is failing.


## TODO:
- [x] **Improve the README.**
- [x] Get the correct PID through pidtree (should we get only the correct fxserver's pid, or sum all the processes? This code usually takes about 40MB so it might be significant enough to include)
- [x] Put the configuration into a json and set default values
- [x] Write the admin log component (or part of another?)
- [x] Separate the web routes
- [ ] Add custom commands to the config file
- [x] **Add a simple rate limiter (MUST)**
- [x] Write some documentation
- [x] **Automatically check for updates (MUST)**
- [ ] Add hitch detection
- [x] Auto restart on schedule (for the unstable servers out there)
- [x] Auto restart if the monitor fails X times in the last Y seconds 
- [x] Better error handling for the discord module

And more...
- [x] Console verbosity settings?
- [ ] Add a `more info` tab and include some config variables, and the complete PID breakdown
- [x] Fix what happens when you stop or start a server that is already running.
- [ ] Separate the DANGER ZONE commands into a separate tab with confirmation dialog?
- [ ] We have data, we should plot it into a graph...
- [x] Add the config file to the arguments so we can run multiple servers in the same installation folder only be specifying it in runtime like `npm start server01.json`
- [x] Protect the log with password. For now I will just disable IP logging.
- [ ] Write a simple `manage_admins.js` script to help with the process. The current `/getHash?pwd=xxx` is counterintuitive at best.
- [ ] Get JSONC compatibility. Inline documentation for the configs would be great.
- [ ] Add machine performance data to the panel. Or not, perhaps that's a little too much into Grafana's land.
- [ ] Average the CPU measure by the last 6 seconds or so?
- [x] **Add discord integration**
- [ ] Multiple server support? Technically easy, but would require massive rework of the interface.
- [ ] FXServer artifact/build auto updater???
- [ ] Automagically send messages in discord when starting/stopping/restarting the server
- [ ] Configurable discord bot static responses. This should be a separate file like the admins one.
- [ ] Discord bot extensions via required js files? Imagine typing `/whitelist @username` and the bot cross referencing the vRP id via the discord:xxx identifier. Or a `/me` giving back this users vRP stats like cars, wallet, bank, apartments & etc.
- [ ] Improve fxRunner/actions responses. Currently it's only 'Done'.
- [ ] Add some sort of detection to see if there is a fxserver running outside fxadmin on the same port.


## License & credits
- This project is licensed under the [MIT License](https://github.com/tabarra/fivem-fxadmin/blob/master/LICENSE).
- Favicons made by Freepik from [www.flaticon.com](www.flaticon.com) are licensed under [CC 3.0 BY](http://creativecommons.org/licenses/by/3.0/)
