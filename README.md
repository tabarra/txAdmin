<div align="center">

<a href="https://discord.gg/AFAAXzq"><img src="https://discordapp.com/api/guilds/577993482761928734/widget.png?style=shield">
# txAdmin for FiveM

<img width="420" height="237" src="docs/banner.png">

[![Image](docs/zaphosting.png)](https://zap-hosting.com/txadmin4 "Zap Hosting with txAdmin")
</div>

## What's txAdmin?
- txAdmin is a fullly featured web panel to manage and monitor your FiveM/RedM server remotely with ease. We're actively being used by over ten thousand servers worldwide at any given moment in time.

## Main Features
- Recipe-based server deployer to create a server in under 60 seconds! ([learn more](docs/recipe.md))
- Start/Stop or Restart your server instance or resources
- Server Performance Chart with all 3 threads ([example](https://i.imgur.com/VG8hpzr.gif))
- Access Control:
	- Admin permission system ([learn more](docs/permissions.md))
	- Login via password or CitizenFX
	- Brute-force protection
	- Action logging
- Discord Integration:
	- Add to Whitelist command  (`/addwl`)
	- Server status command (`/status`)
	- Command spam prevention
- Monitoring:
	- Server Activity Log (connections/disconnections, kills, chat, explosions and [custom commands](docs/custom_serverlog.md))
	- Live console (with log file and command history)
	- Auto-restart FXServer on crash
	- Server’s CPU/RAM consumption
	- Online players chart
- Player Manager:
	- Clean/Optimize the database by removing old players, or bans/warns/whitelists
	- Self-contained player database with backup tool (MySQL not required)
	- Import bans from EasyAdmin, BanSQL, vMenu, vRP, el_bwh
	- Ban (temporary or permanently) system
	- Keep track of player's play and session time
	- Take notes about players
	- Whitelist system
	- [Warning system](https://www.youtube.com/watch?v=DeE0-5vtZ4E)
- Scheduled restarts with warning announcements and custom events ([learn more](docs/events.md))
- Responsive web interface with a soothing dark mode
- Translation support ([learn more](docs/translation.md))
- Real-time playerlist
- FiveM's CFG editor

You can check out our [Feature Graveyard](docs/feature_graveyard.md) for the previous features that are no longer among us. May they rest in peace.

## Running (Windows and Linux)
Currently **txAdmin is included in all FXServer builds** above 2524, so to run it for the first time simply do the following:
- Update FXServer to the latest artifact/build (2524 or superior)
- If Windows, run FXServer.exe | If Linux, run `screen ./run.sh`
- Open one of the URLs shown and configure txAdmin

After that you could also run the `start_<build>_<profile>.bat` file created, or call it via cmd/bash if you want to edit the ConVars (ex http port).  
  
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

### Installing & Building Manually (NOT RECOMMENDED)
If you want to run it from source, or build it yourself, please do read [this](docs/building.md).


## License, Credits and Thanks
- This project is licensed under the [MIT License](https://github.com/tabarra/txAdmin/blob/master/LICENSE);
- [Favicons](https://www.flaticon.com/free-icon/support_1545728?term=gear%20wrench&page=2&position=11) made by Freepik from [www.flaticon.com](https://www.flaticon.com) are licensed under [CC 3.0 BY](http://creativecommons.org/licenses/by/3.0/);
- Warning Sounds ([1](https://freesound.org/people/Ultranova105/sounds/136756/)/[2](https://freesound.org/people/Ultranova105/sounds/136754/)) made by Ultranova105 are licensed under [CC 3.0 BY](http://creativecommons.org/licenses/by/3.0/);
- Special thanks to everyone that contributed to this project, specially the very fine Discord folks that provide support for others;
- Also thanks to our Discord's `sky{something}` bot, who will hopefully spare us when he becomes self aware and rebels against humanity. 
