<div align="center">

<a href="https://discord.gg/AFAAXzq"><img src="https://discordapp.com/api/guilds/577993482761928734/widget.png?style=shield">
# txAdmin for FiveM

<img width="420" height="237" src="docs/banner.png">

[![Image](docs/zaphosting.png)](https://zap-hosting.com/txadmin4 "Zap Hosting with txAdmin")

</div>

## What's txAdmin?
- txAdmin is a fully featured web panel to manage and monitor your FiveM/RedM server remotely with ease. We're actively being used by over ten thousand servers worldwide at any given moment in time.

## Unique Characteristics
- [Recipe-based](docs/recipe.md) deployer to create a FiveM server in under 60 seconds.
- Scheduled restarts with warning announcements and [custom events](docs/events.md).
- Instantly start, stop and restart your server instance or resources.
- Responsive web interface with a soothing dark mode.
- Server performance chart with [all three threads](https://i.imgur.com/VG8hpzr.gif).
- Config editor & real-time playerlist.
- Advanced [translation support](docs/translation.md).
- Player/Client Management
	- Clean or optimize your database by removing old players, bans, warnings and whitelists
	- Self contained player database with a backup tool that doesn't require MySQL
	- Import bans from EasyAdmin, BanSQL, vMenu, vRP and el_bwh
	- Temporary or permanent punishment (ban) system
	- Modern user playtime/session tracking structure
	- Whitelist and [warning](https://www.youtube.com/watch?v=DeE0-5vtZ4E) system
	- Admin-issued player notes
- Monitoring Services
	- Server activity log for connections, explosions, kills, chat and [custom commands](docs/custom_serverlog.md)
	- Live console with a log file and command history
	- Automatic FXServer crash restarter
	- Server’s CPU/RAM consumption
- Discord Integration
	- Command: add to whitelist (`/addwl`)
	- Command: server status (`/status`)
	- Command spam prevention
- Access Control
	- Easy-login via password or CitizenFX
	- Brute-force protection & safeguard
    - Administrative [permission system](docs/permissions.md)
	- Total action logging

You can check out our [Feature Graveyard](docs/feature_graveyard.md) for the previous features that are no longer among us. May they rest in peace.

## Deploying on Windows
txAdmin currently is included in **all FXServer builds** above artifact 2524.
- Go to the FiveM [artifacts page](https://runtime.fivem.net/artifacts/fivem/build_server_windows/master/) and download the latest release (2524 or newer).
- Extract this downloaded artifact [`server.zip`] where you'd like to store the server. We'll pick `C:\FXServer\artifact`.
- Go into the artifact folder and execute the FXServer.exe file.
- Follow all basic txAdmin setup questions.

For further information, consult the [FiveM docs](https://docs.fivem.net/docs/server-manual/setting-up-a-server/).

## Deploying on Linux
Note that the Linux version of FXServer is only provided as a courtesy port due to issues regarding Linux distribution compatibility and availability of diagnostic tools for native C++ code. If you’re experiencing any issues, you’re more likely to see them fixed if you use the Windows version.
- Create a new folder (for example mkdir -p /home/username/FXServer/server), this will be used for the server binaries.
- Download the current recommended master branch build for Linux from the [artifacts server](https://runtime.fivem.net/artifacts/fivem/build_proot_linux/master/) (copy the URL for the latest server version and use wget <url> to download it).
- Extract the build to the directory that was previously created, using cd /home/username/FXServer/server && tar xf fx.tar.xz (you need to have xz installed, on Debian/Ubuntu this is in the xz-utils package).
- Clone [cfx-server-data](https://github.com/citizenfx/cfx-server-data) in a new folder outside of your server binaries folder.
- 4b. For example git clone https://github.com/citizenfx/cfx-server-data.git /home/username/FXServer/server-data 5. Make a server.cfg file in your server-data folder (copy the example server.cfg file below into that file). 6. Set the license key in your server.cfg using sv_licenseKey "licenseKeyGoesHere". 7. Run the server from the server-data folder.
7b. bash /home/username/FXServer/server/run.sh +exec server.cfg

For further information, consult the [FiveM docs - Linux](https://docs.fivem.net/docs/server-manual/setting-up-a-server/#linux).

### Additional Information
- Learn more about manually building txAdmin at [building.md](docs/building.md).
- Learn more about ConVars at [convars.md](docs/convars.md).

## Licensing and Credits
- txAdmin is licensed under the [MIT License](https://github.com/tabarra/txAdmin/blob/master/LICENSE).
- Warning Sounds ([1](https://freesound.org/people/Ultranova105/sounds/136756/) - [2](https://freesound.org/people/Ultranova105/sounds/136754/)) made by Ultranova105 are licensed under [CC 3.0 BY](http://creativecommons.org/licenses/by/3.0/).
- [Favicons](https://www.flaticon.com/free-icon/support_1545728?term=gear%20wrench&page=2&position=11) made by Freepik from [www.flaticon.com](https://www.flaticon.com) are licensed under [CC 3.0 BY](http://creativecommons.org/licenses/by/3.0/).
- Special thanks to everyone that contributed to this project, specially the very fine Discord folks that provide support for others.
- Also thanks to our Discord's `sky{something}` bot, who will hopefully spare us when he becomes self aware and rebels against humanity. 
