<div align="center">
	<img src="https://discordapp.com/api/guilds/577993482761928734/widget.png?style=shield"></img></a>
	<h1>txAdmin for FiveM</h1>
	<img align="center" width="420" height="237" src="docs/banner.png">
	<br><a href="https://zap-hosting.com/txadmin4" target="_blank" rel="noopener">
	<br><img src="docs/zaphosting.png" alt="zap-hosting"></img></a>
	<br><br>txAdmin is a <b>completely free to use</b>, full-featured <b>web panel</b> to Manage & Monitor your FiveM Server remotely, in use by over <b>TEN thousand servers</b> worldwide at any given time.
</div>

## Main Features
- Recipe-based server deployer: create a live server in under 60 seconds [[learn more](docs/recipe.md)].
- Scheduled restarts with warning announcements and custom events [[learn more](docs/events.md)].
- Start, stop and restart your server instance or resources.
- FXServer performance chart for all 3 threads [[example](https://i.imgur.com/VG8hpzr.gif)].
- Multi language translation support [[learn more](docs/translation.md)].
- Responsive dark and light mode web interface.
- FXServer CFG editor.
- Discord Integration:
	- Add to Whitelist command (`/addwl`);
	- Server status command (`/status`);
	- Command spam prevention.
- Access Control:
	- Admin permission system [[more info](docs/permissions.md)];
	- Login via password or CitizenFX;
	- Brute-force protection;
	- Action logging.
- Monitoring:
	- Advanced server activity log for connections, disconnections, kills, chat, explosions and [custom commands](docs/custom_serverlog.md);
	- Live console with a backend log file and command history;
	- Auto FXServer restart on crash detected;
	- Server’s CPU/RAM consumption;
	- Online players chart.
- Player Manager:
	- Clean and optimize your database by removing old players, or bans/warns/whitelists;
	- Self-contained player database with backup tool that doesn't require MySQL;
	- Ban imports from EasyAdmin, BanSQL, vMenu, vRP, el_bwh;
	- Player session time management & notes system;
	- Temporary or permanent banning system;
	- Whitelist & [warning system](https://www.youtube.com/watch?v=DeE0-5vtZ4E).

Also, check our [Feature Graveyard](docs/feature_graveyard.md) for the features that are no longer among us (RIP).

## Running [Windows & Linux]
Currently **txAdmin is included in all FXServer builds** above 2524, so to run it for the first time simply do the following:
- Update FXServer to the latest artifact/build (2524 or superior);
- Windows: run FXServer.exe / Linux:, run `screen ./run.sh`;
- Open one of the URLs shown and configure txAdmin.

After that you could also run the `start_<build>_<profile>.bat` file created, or call it via cmd/bash if you want to edit the ConVars (ex HTTP port).  
  
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

### Installing & Building (NOT RECOMMENDED)
If you want to run it from source, or build it yourself, please do read [this](docs/building.md).


## License, Credits and Thanks
- This project is licensed under the [MIT License](https://github.com/tabarra/txAdmin/blob/master/LICENSE);
- [Favicons](https://www.flaticon.com/free-icon/support_1545728?term=gear%20wrench&page=2&position=11) made by Freepik from [www.flaticon.com](https://www.flaticon.com) are licensed under [CC 3.0 BY](http://creativecommons.org/licenses/by/3.0/);
- Warning Sounds ([1](https://freesound.org/people/Ultranova105/sounds/136756/)/[2](https://freesound.org/people/Ultranova105/sounds/136754/)) made by Ultranova105 are licensed under [CC 3.0 BY](http://creativecommons.org/licenses/by/3.0/);
- Special thanks to everyone that contributed to this project, specially the very fine Discord folks that provide support for others;
- Also thanks to our Discord's `sky{something}` bot, who will hopefully spare us when he becomes self aware and rebels against humanity. 
