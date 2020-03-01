<p align="center">
	<h1 align="center">
		txAdmin for FiveM
	</h1>
	<p align="center">
		<img width="420" height="237" src="docs/banner.png">
	</p>
	<h4 align="center">
		Join our Discord Server: &nbsp; <a href="https://discord.gg/f3TsfvD"><img src="https://discordapp.com/api/guilds/577993482761928734/widget.png?style=shield"></img></a>
	</h4>
	<p align="center">
		<b>txAdmin</b> is a <b>full featured</b> web panel to Manage & Monitor your FiveM Server remotely.
	</p>
</p>

<br/>


## Main Features
- Start/Stop/Restart your server instance or resources
- Access control:
	- Login via Password, CitizenFX or Discord
	- Admin permission system ([more info](docs/permissions.md))
	- Action logging
	- Brute-force protection
- Discord Integration:
	- Server status command (`/status`)
	- Custom static commands
	- Command spam prevention
- Monitoring:
	- Auto Restart on crash
	- Server’s CPU/RAM consumption
	- Live Console (with log file)
	- Hitch Detection statistics
	- Online players chart
	- Server Activity Log (connections/disconnections, kills, chat, explosions and [custom commands](docs/extra_logging.md))
- Real-time playerlist with ping + steam-linked accounts (when available)
- Scheduled restarts with warning announcements
- Translation Support ([more info](docs/translation.md))
- FiveM's Server CFG editor


## Installing & Running (Windows/Linux)

If your copy of FXServer doesn't come with txAdmin (`citizen/system_resources/txAdmin`), you can install with the following steps:

```bash
#Inside your FXServer folder, execute:
cd citizen/system_resources
mv monitor monitorOld
git clone -b conversion https://github.com/tabarra/txAdmin monitor
cd monitor
npm i
```

Then to run it, just execute the `run.sh` or `run.cmd` without **any** `+exec` arguments.  
An `txData` folder will be created in your current working directory.  

### ConVars
- **serverProfile:** The name of the server profile to start. Profiles are saved/loaded from the current directory inside the `txData` folder.
- **txAdminPort:** The TCP port to use as HTTP Server.
- **txDataPath:** The path of the data folder. The default on Windows is `<citizen_root>/../txData` and on Linux `<citizen_root>/../../../txData`.

ConVar usage **example** on Windows:  
```bash
# Windows
./run.cmd +set serverProfile dev_server +set txAdminPort 40125 +set txDataPath "%userprofile%/Desktop/txData"

# Linux
./run.sh +set serverProfile dev_server +set txAdminPort 40125 +set txDataPath "~/fxserver/txData"
```

## License, Credits and Thanks
- This project is licensed under the [MIT License](https://github.com/tabarra/txAdmin/blob/master/LICENSE).
- Favicons made by Freepik from [www.flaticon.com](www.flaticon.com) are licensed under [CC 3.0 BY](http://creativecommons.org/licenses/by/3.0/)
- Special thanks to everyone that contributed to this project.
