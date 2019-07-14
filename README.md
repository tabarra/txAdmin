<p align="center">
	<h1 align="center">
		txAdmin for FiveM
	</h1>
	<p align="center">
		<img width="420" height="237" src="https://i.imgur.com/acV0dfO.png">
	</p>
	<h4 align="center">
		FiveM Forum thread: &nbsp; <a href="https://forum.fivem.net/t/530475"><img src="https://img.shields.io/badge/dynamic/json.svg?color=green&label=txAdmin&query=views&suffix=%20views&url=https%3A%2F%2Fforum.fivem.net%2Ft%2F530475.json"></img></a>  <br/>
		Join our Discord Server: &nbsp; <a href="https://discord.gg/f3TsfvD"><img src="https://discordapp.com/api/guilds/577993482761928734/widget.png?style=shield"></img></a>
	</h4>
	<p align="center">
		<b>txAdmin</b> (formerly known as FXAdmin) is a <b>full featured</b> tool to Manage & Monitor your FiveM Server remotely.
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
- Auto Restart on failure detection or schedule
- Password brute-force protection
- FXServer process priority setter
- Hitch Detection
- New settings page
- Save console to file
- Restart warning announcements
- Admin Management system
- Permissions system ([more info](docs/permissions.md))


## Installing & Running
First, make sure you have:
- NodeJS v10 LTS (Otherwise you WILL have problems with node-gyp/bcrypt/discord.js)
- FXServer [(duh)](https://runtime.fivem.net/artifacts/fivem/)
- One TCP listen port opened for the web server (default is 40120)
- Git (only for installs and updates)

**1 -** In the terminal (cmd, bash, powershell & etc) execute:
```bash
# Download txAdmin, Enter folder and Install dependencies
$ git clone https://github.com/tabarra/txAdmin
$ cd txAdmin
$ npm i

# Add admin
$ node src/scripts/admin-add.js

# Setup default server profile
$ node src/scripts/setup.js default

# Start default server
$ node src/index.js default
```

**2 -** Then open `http://public-ip:40120/` in your browser and login with the credentials created and go to the settings page to configure the remaining settings.   
If on Windows, you can start the server by executing `start.bat` in your server profile's folder (example `data/default/start.bat`).  

> **Note:** You should run FXServer **through** txAdmin, and not in parallel (ie in another terminal).  

> **Note2:** To configure your Discord bot, follow these two guides:  [Setting up a bot application](https://discordjs.guide/preparations/setting-up-a-bot-application.html) and [Adding your bot to servers](https://discordjs.guide/preparations/adding-your-bot-to-servers.html).  

> **Note3:** Although **not recommended**, you can set FXServer processes priorities. To do so, change `fxRunner.setPriority` to one of the following: LOW, BELOW_NORMAL, NORMAL, ABOVE_NORMAL, HIGH, HIGHEST.  

> **Note4:** To create more server profiles, execute `node src/scripts/setup.js <profile name>`.  

## Troubleshooting
### If you run into any problem, check our [Troubleshooting Guide](docs/troubleshooting.md).   
If you are having trouble starting the FXServer via txAdmin, run `node src/scripts/config-tester.js default` and see which test is failing.  

## Updating
To **UPDATE** txAdmin execute:
```bash
$ git pull
$ npm i
``` 
If you have any problems with `package-lock.json`, just delete it and try again.  
> **Note:** This will only work if you downloaded txAdmin using the `git clone` command.  


  
## TODO:
- [ ] Reorganize all files/folders
- [ ] Write version bumper script
- [ ] Write resource injector
- [ ] Add custom commands to the config file
- [x] Config tester check for the modules inside `package.json` (require.resolve?)
- [ ] Config tester kill spawned fxserver after 5 seconds
- [ ] Investigate the "fxserver has stopped working" not disappearing when autorestarter kills the server (probably windows detaches it? in that case we would need to PID map and then kill them one by one?)
- [ ] Remove `forceFXServerPort`, 10x more complicated than it should be for a feature that probably won't even be used

TODO Ideas...
- [x] We have data, we should plot it into a graph...
- [ ] ~~Multiple server support? Technically easy, but would require massive rework of the interface.~~ (This will be solved by linking multiple txAdmin instances via an master control extension)
- [ ] FXServer artifact/build auto updater???
- [x] Automagically send messages in discord when starting/stopping/restarting the server
- [ ] Discord bot extensions via required js files? Imagine typing `/whitelist @username` and the bot cross referencing the vRP id via the discord:xxx identifier. Or a `/me` giving back this users vRP stats like cars, wallet, bank, apartments & etc.
- [ ] Add some sort of detection to see if there is a fxserver running outside txAdmin on the same port.

The old TODO can be found [here](docs/old_todo.md). 

## License & Credits
- This project is licensed under the [MIT License](https://github.com/tabarra/txAdmin/blob/master/LICENSE).
- Favicons made by Freepik from [www.flaticon.com](www.flaticon.com) are licensed under [CC 3.0 BY](http://creativecommons.org/licenses/by/3.0/)
