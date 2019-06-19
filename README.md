<p align="center">
	<h1 align="center">
		FiveM-FXAdmin
	</h1>
	<h4 align="center">
		FiveM Forum thread: &nbsp; <a href="https://forum.fivem.net/t/530475"><img src="https://img.shields.io/badge/dynamic/json.svg?color=green&label=FXAdmin&query=views&suffix=%20views&url=https%3A%2F%2Fforum.fivem.net%2Ft%2F530475.json"></img></a>  <br/>
		Join our Discord Server: &nbsp; <a href="https://discord.gg/f3TsfvD"><img src="https://discordapp.com/api/guilds/577993482761928734/widget.png?style=shield"></img></a>
	</h4>
	<p align="center">
		FXAdmin is a <b>full featured</b> tool to help you Manage & Monitor your FiveM Server remotely.
	</p>
	<p align="center">
		<b>
		Important Notice (14/jun/2019): <br>
		Due to a recent change in FiveM's ToS we had to rename this project to txAdmin.<br>
		Join our Discord Server for more information.<br>
		This repository will be renamed soon.
		</b>
	</p>
</p>

<br/>

  

## Features
- Start/Stop/Restart your server instance or resources
- Access control via multiple credentials and action logging
- Discord integration (/status and configurable commands)
- Monitor server’s CPU/RAM consumption
- Real-time playerlist with ping + steam-linked accounts (when available)
- OneSync Support (more than 32 slots server)
- Linux Support
- Live Console
- Auto Restart on failure detection
- Auto Restart on schedule
- Password brute-force protection
- Set FXServer process priority
- Hitch Detection


## Installation
First, make sure you have:
- NodeJS v10+ (If you have problems with node-gyp/bcrypt/discord.js try downgrading to Node v10 LTS)
- FXServer [(duh)](https://runtime.fivem.net/artifacts/fivem/)
- One TCP listen port opened for the web server
- Git (only for installs and updates)

**1 -** To **INSTALL** FXAdmin execute:
```bash
$ git clone https://github.com/tabarra/txAdmin
$ cd txAdmin
$ npm i
```

**2 -** Copy your `server-template.json` to `server.json` and modify it according to your preferences. The most important settings:  
- `global.fxServerPort` is your fxServer port as configured in your `server.cfg`.
- `monitor.restarter.schedule` is the restart schedule. The time MUST be in the 24-hour format with two digits for hours as well as minutes (`HH:MM`). Leave the array empty or set it to false to disable the feature.
- `fxRunner.buildPath` is the folder containing the files `run.cmd`, `fxserver.exe` and a bunch of DLLs in case of Windows, and only `run.sh` in case of Linux.
- `fxRunner.basePath` is the folder that **contains** the `resources` folder, usually it's here that you put your `server.cfg`.
- `fxRunner.cfgPath` is the absolute or relative path of your `server.cfg`.

**3 -** To add an admin execute:
```bash
$ npm run admin-add
```
If you want to manage existing admins you must edit the JSON file yourself. Make sure your admins file folow `admins-template.json`. To generate the hashed password, you can use tools like [this](https://www.browserling.com/tools/bcrypt) and [this](https://bcrypt-generator.com) or even [this one](https://passwordhashing.com/BCrypt).  
  
**4 -** To **RUN** FXAdmin execute:
```bash
$ npm start server.json
```

**Note:** You should run FXServer **through** FXAdmin, and not in parallel (ie in another terminal).  
**Note2:** To configure your Discord bot, follow these two guides:  [Setting up a bot application](https://discordjs.guide/preparations/setting-up-a-bot-application.html) and [Adding your bot to servers](https://discordjs.guide/preparations/adding-your-bot-to-servers.html).  
**Note3:** Although **not recommended**, you can set FXServer processes priorities. To do so, change `fxRunner.setPriority` to one of the following: LOW, BELOW_NORMAL, NORMAL, ABOVE_NORMAL, HIGH, HIGHEST.


## Troubleshooting
### If you run into any problem, check our [Troubleshooting Guide](docs/troubleshooting.md).   
If you are having trouble starting the FXServer via FXAdmin, run `npm run config-tester server.json` and see which test is failing.  

## Updating
To **UPDATE** FXAdmin execute:
```bash
$ git pull
$ npm i
```
Make sure there's no differences in the json templates. If there is, copy the new template and edit again.  
If you have any problems with the `package-lock.json`, just delete it and try again.  

## TODO:
- [ ] Add custom commands to the config file
- [x] Add hitch detection
- [x] Add fxadmin_version fxserver svar
- [ ] Config tester check for the modules inside `package.json` (require.resolve?)
- [ ] Config tester kill spawned fxserver after 5 seconds
- [ ] Investigate the "fxserver has stopped working" not disappearing when autorestarter kills the server (probably windows detaches it? in that case we would need to PID map and then kill them one by one?)

TODO Ideas...
- [ ] Add a `more info` tab and include some config variables, and the complete PID breakdown
- [x] Separate the DANGER ZONE commands into a separate tab with confirmation dialog?
- [ ] We have data, we should plot it into a graph...
- [x] Write a simple `manage_admins.js` script to help with the process. The current `/getHash?pwd=xxx` is counterintuitive at best.
- [ ] Get JSONC compatibility. Inline documentation for the configs would be great.
- [x] Add machine performance data to the panel. Or not, perhaps that's a little too much into Grafana's land.
- [ ] Multiple server support? Technically easy, but would require massive rework of the interface.
- [ ] FXServer artifact/build auto updater???
- [ ] Automagically send messages in discord when starting/stopping/restarting the server
- [x] Configurable discord bot static responses. This should be a separate file like the admins one.
- [ ] Discord bot extensions via required js files? Imagine typing `/whitelist @username` and the bot cross referencing the vRP id via the discord:xxx identifier. Or a `/me` giving back this users vRP stats like cars, wallet, bank, apartments & etc.
- [x] Improve fxRunner/actions responses. Currently it's only 'Done'.
- [ ] Add some sort of detection to see if there is a fxserver running outside fxadmin on the same port.

The old TODO can be found [here](docs/old_todo.md). 

## License & Credits
- This project is licensed under the [MIT License](https://github.com/tabarra/txAdmin/blob/master/LICENSE).
- Favicons made by Freepik from [www.flaticon.com](www.flaticon.com) are licensed under [CC 3.0 BY](http://creativecommons.org/licenses/by/3.0/)
