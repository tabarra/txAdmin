<p align="center">
	<h1 align="center">
		txAdmin for FiveM
	</h1>
	<p align="center">
		<img width="420" height="237" src="https://i.imgur.com/acV0dfO.png">
	</p>
	<h4 align="center">
		<!-- FiveM Forum thread: &nbsp; <a href="https://forum.fivem.net/t/530475"><img src="https://img.shields.io/badge/dynamic/json.svg?color=green&label=txAdmin&query=views&suffix=%20views&url=https%3A%2F%2Fforum.fivem.net%2Ft%2F530475.json"></img></a>  <br/> -->
		Join our Discord Server: &nbsp; <a href="https://discord.gg/f3TsfvD"><img src="https://discordapp.com/api/guilds/577993482761928734/widget.png?style=shield"></img></a>
	</h4>
	<p align="center">
		<b>txAdmin</b> is a <b>full featured</b> web panel to Manage & Monitor your FiveM Server remotely.
	</p>
</p>

<br/>


## This is the CONVERSION branch. 
**Expect everything to be messy, and 40% of it to not work.**  

### Replace old monitor and install dependencies
```bash
#Inside your fxserver folder, execute:
cd citizen/system_resources
mv monitor monitorOld
git clone -b conversion https://github.com/tabarra/txAdmin monitor
cd monitor
npm i
```
Patch Discord.js library "bug":  
Navigate to `node_modules\discord.js\src\client\Client.js` and around line 250 change the `window !== 'undefined';` to `process == 'undefined';`.
> Well... the patch isn't working but I will investigate later 🤷

Then to run it, just execute the `run.sh` or `run.cmd` without **any** `+exec` arguments.  

### ConVars
- **serverProfile:** The name of the server profile to start. Profiles are saved/loaded from the current directory inside the `txData` folder.
- **txAdminPort:** The TCP port to use as HTTP Server.

### Web Port Behaviour
- **(Current)** Without Nucleus integration:
    - From ConVar
    - Defaults to 40120, creates an http server
- **(Planned)** With Nucleus integration (single/multi server):
    - Grabs ConVar
    - Defaults to null, don't create http server unless port is specified

## License, Credits and Thanks
- This project is licensed under the [MIT License](https://github.com/tabarra/txAdmin/blob/master/LICENSE).
- Favicons made by Freepik from [www.flaticon.com](www.flaticon.com) are licensed under [CC 3.0 BY](http://creativecommons.org/licenses/by/3.0/)
- Special thanks to everyone that contributed to this project.
