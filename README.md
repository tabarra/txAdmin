<p align="center">
	<h1 align="center">
		txAdmin for FiveM
	</h1>
	<p align="center">
		<img width="420" height="237" src="docs/banner.png">
	</p>
	<h4 align="center">
		Join our Discord Server: &nbsp; <a href="https://discord.gg/AFAAXzq"><img src="https://discordapp.com/api/guilds/577993482761928734/widget.png?style=shield"></img></a>
	</h4>
	<p align="center">
		<b>txAdmin</b> is a <b>full featured</b> web panel to Manage & Monitor your FiveM/RedM Server remotely, in use by over <strong>21.000</strong> servers worldwide at any given time.
	</p>
	<p align="center">
		<a href="https://zap-hosting.com/txadmin4" target="_blank" rel="noopener">
			<img src="docs/zaphosting.png" alt="zap-hosting"></img>
		</a>
	</p>
</p>

<br/>


## Main Features
- Recipe-based Server Deployer: create a server in under 60 seconds! ([more info](docs/recipe.md))
- Start/Stop/Restart your server instance or resources
- Full-featured in-game admin menu:
	- Player Mode: NoClip, God, SuperJump
	- Teleport:  waypoint, coords and back
	- Vehicle: Spawn, Fix, Delete, Boost
	- Heal: yourself, everyone
	- Send Announcements
	- Reset World Area
	- Show player IDs
	- Player search/sort by distance, ID, name
	- Player interactions: Go To, Bring, Spectate, Freeze
	- Player troll: make drunk, set fire, wild attack
	- Player ban/warn/dm
- Access control:
	- Login via Password or CitizenFX
	- Admin permission system ([more info](docs/permissions.md))
	- Action logging
	- Brute-force protection
- Discord Integration:
	- Server configurable, persistent, auto-updated status embed
	- Command to whitelist players
	- Command to display player infos
- Monitoring:
	- Auto Restart FXServer on crash or hang
	- Server’s CPU/RAM consumption
	- Live Console (with log file, command history and search)
	- Server tick time performance chart with player count ([example](https://i.imgur.com/VG8hpzr.gif))
	- Server Activity Log (connections/disconnections, kills, chat, explosions and [custom commands](docs/custom_serverlog.md))
- Player Manager:
	- [Warning system](https://www.youtube.com/watch?v=DeE0-5vtZ4E)
	- Ban (temporary or permanently) system
	- Whitelist system (Discord member, Discord Role, Approved License, Admin-only)
	- Take notes about players
	- Keep track of player's play and session time
	- Self-contained player database with backup tool (no MySQL required!)
	- Clean/Optimize the database by removing old players, or bans/warns/whitelists
- Real-time playerlist
- Scheduled restarts with warning announcements and custom events ([more info](docs/events.md))
- Translation Support ([more info](docs/translation.md))
- FiveM's Server CFG editor & validator
- Responsive web interface with Dark Mode 😎

Also, check our [Feature Graveyard](docs/feature_graveyard.md) for the features that are no longer among us (RIP).

## Running (Windows/Linux)
**txAdmin is included in all FXServer builds** above 2524, so to run it for the first time simply do the following:
- Update FXServer to the latest artifact/build (2524 or superior)
- If Windows, run FXServer.exe | If Linux, run `screen ./run.sh`
- Open one of the URLs shown and configure txAdmin

txAdmin requires to be launched from *inside* FXServer in monitor mode, to do that, just execute the `run.sh` or `FXServer.exe` without **any** `+exec` arguments.  
  
### ConVars
- **serverProfile:** The name of the server profile to start. Profiles are saved/loaded from the current directory inside the `txData` folder. The default is `default`.
- **txAdminPort:** The TCP port to use as HTTP Server. The default is `40120`.
- **txAdminInterface:** The interface to use as HTTP Server. The default is `0.0.0.0`.
- **txDataPath:** The path of the data folder. The default on Windows is `<citizen_root>/../txData` and on Linux `<citizen_root>/../../../txData`.
- **txAdminVerbose:** Set to `true` to print on the console more detailed information about errors and events. The default is `false`.
  
ConVar usage **example** for different port and profile:  
```bash
# Windows
./FXServer.exe +set serverProfile dev_server +set txAdminPort 40121

# Linux
./run.sh +set serverProfile dev_server +set txAdminPort 40121
```

### Contributing & Development
- All PRs should be based on the develop branch, including translation PRs.
- Before putting effort for any significant PR, make sure to join our discord and talk to us, since the change you want to do might not have been done for a reason or there might be some required context.
- If you want to run it from build & source, please do read [this](docs/development.md).


## License, Credits and Thanks
- This project is licensed under the [MIT License](https://github.com/tabarra/txAdmin/blob/master/LICENSE);
- ["Kick" button icons](https://www.flaticon.com/free-icon/users-avatar_8188385) made by __SeyfDesigner__ from [www.flaticon.com](https://www.flaticon.com);
- Warning Sounds ([1](https://freesound.org/people/Ultranova105/sounds/136756/)/[2](https://freesound.org/people/Ultranova105/sounds/136754/)) made by __Ultranova105__ are licensed under [CC 3.0 BY](http://creativecommons.org/licenses/by/3.0/);
- [Announcement Sound](https://freesound.org/people/IENBA/sounds/545495/) made by __IENBA__ is licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/);
- [Message Sound](https://freesound.org/people/Divinux/sounds/198414/) made by __Divinux__ is licensed under [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/);
- Especial thanks to everyone that contributed to this project, especially the very fine Discord folks that provide support for others;
