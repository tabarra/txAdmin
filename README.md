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
**Expect everything to be messy, and half of it to not work.**  
If anybody want to try to run it, just download the latest artifact (1919, seriously wont work before that) then inside the folder execute:
```bash
# Replace old monitor and install dependencies
cd citizen/system_resources
mv monitor monitorOld
git clone -b conversion https://github.com/tabarra/txAdmin monitor
cd monitor
npm i

# Add admin
node src/scripts/admin-add.js

# Setup default server profile
node src/scripts/setup.js default
```
Then to run it, just execute the `run.sh` or `run.cmd` without **any** arguments.
  
## License, Credits and Thanks
- This project is licensed under the [MIT License](https://github.com/tabarra/txAdmin/blob/master/LICENSE).
- Favicons made by Freepik from [www.flaticon.com](www.flaticon.com) are licensed under [CC 3.0 BY](http://creativecommons.org/licenses/by/3.0/)
- Special thanks to everyone that contributed to this project.
