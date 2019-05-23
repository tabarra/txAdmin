# FiveM-FXAdmin
Join our **Discord Server**: [![Discord](https://discordapp.com/api/guilds/577993482761928734/widget.png?style=shield)](https://discord.gg/f3TsfvD)

This is a very simple tool to help you manage your FiveM server remotely.  

One of the problems I noticed with the servers out there is that the "bases" are usually very tightly coupled with the FXServer build, this tool helps you use or test multiple builds at the same time on the same resources folder.  


## Features
- Start/Stop/Restart your server instance or resources
- Access control via multiple credentials and action logging
- Discord integration (for now, just the /status command)
- Monitor server’s CPU/RAM consumption
- Real-time playerlist with ping + steam-linked accounts (when available)
- OneSync Support (more than 32 slots server)


## Installation
First, make sure you have:
- NodeJS v10 or v11 (with npm) (bcrypt module might have some errors with node v12)
- FXServer [(duh)](https://runtime.fivem.net/artifacts/fivem/)
- One TCP listen port opened for the web server

Then to install:
```bash
$ git clone https://github.com/tabarra/fivem-fxadmin
$ cd fivem-fxadmin
$ npm install
```
Copy your `server-template.json` to `server.json` and modify it according to your preferences.  
- `buildPath` is the folder containing the files `run.cmd`, `fxserver.exe` and a bunch of DLLs.
- `basePath` is the folder that **contains** the `resources` folder, usually it's here that you put your `server.cfg`.
- `cfgPath` is the absolute or relative path of your `server.cfg`.

Do the same thing to your `admins-template.json`. To generate the hashed password, you can use tools like [this](https://www.browserling.com/tools/bcrypt) and [this](https://bcrypt-generator.com) or even [this one](https://passwordhashing.com/BCrypt).  
  
To run FXAdmin:
```bash
$ node src/main.js server.json
```

**Note:** To configure your Discord bot, follow these two guides:  [Setting up a bot application](https://discordjs.guide/preparations/setting-up-a-bot-application.html) and [Adding your bot to servers](https://discordjs.guide/preparations/adding-your-bot-to-servers.html).  
**Note2:** To run multiple servers with the same base and FXAdmin installation, just duplicate your config.json and change the ports. Two instances of FXAdmin cannot be running in the same web server port.


## Troubleshooting
- If you are getting `Wrong password!` when executing an action, make sure you have your admins file configured correctly. If there is anything wrong with the file you should get an error when starting FXAdmin.
- If you are getting `Server error: timeout of 1000ms exceeded` it means the fxserver is offline, start it in the web panel.
- If you are having trouble starting the fxserver via fxadmin, run `node src/config-tester.js server.json` and see which test is failing.
- If you run into problems when executing `npm install`, try `npm i node-gyp` or `npm i --global --production windows-build-tools` if you are on windows.  


## TODO:
- [x] **Improve the README.**
- [x] Get the correct PID through pidtree (should we get only the correct fxserver's pid, or sum all the processes? This code usually takes about 40MB so it might be significant enough to include)
- [x] Put the configuration into a json and set default values
- [x] Write the admin log component (or part of another?)
- [x] Separate the web routes
- [ ] Add custom commands to the config file
- [ ] **Add a simple rate limiter (MUST)**
- [x] Write some documentation
- [x] **Automatically check for updates (MUST)**
- [ ] Add hitch detection
- [ ] Auto restart on schedule (for the unstable servers out there)
- [ ] Auto restart if the monitor fails X times in the last Y seconds 
- [x] Better error handling for the discord module

And more...
- [x] Console verbosity settings?
- [ ] Add a `more info` tab and include some config variables, and the complete PID breakdown
- [x] Fix what happens when you stop or start a server that is already running.
- [ ] Separate the DANGER ZONE commands into a separate tab with confirmation dialog?
- [ ] We have data, we should plot it into a graph...
- [x] Add the config file to the arguments so we can run multiple servers in the same installation folder only be specifying it in runtime like `node src/main.js server01.json`
- [ ] Protect the log with password. For now I will just disable IP logging.
- [ ] Write a simple `manage_admins.js` script to help with the process. The current `/getHash?pwd=xxx` is counterintuitive at best.
- [ ] Get JSONC compatibility. Inline documentation for the configs would be great.
- [ ] Add machine performance data to the panel. Or not, perhaps thats a little too much into Grafana's land.
- [ ] Average the CPU measure by the last 6 seconds or so?
- [x] **Add discord integration**
- [ ] Multiple server support? Technically easy, but would require massive rework of the interface.
- [ ] FXServer artifact/build auto updater???
- [ ] Automagically send messages in discord when starting/stopping/restarting the server
- [ ] Configurable discord bot static responses. This should be a separate file like the admins one.
- [ ] Discord bot extensions via required js files? Imagine typing `/whitelist @username` and the bot cross referencing the vRP id via the discord:xxx identifier. Or a `/me` giving back this users vRP stats like cars, wallet, bank, apartments & etc.
- [ ] Improve fxRunner/actions responsed. Currently it's only 'Done'.


## License & credits
- This project is licensed under the [MIT License](https://github.com/tabarra/fivem-fxadmin/blob/master/LICENSE).
- Favicons made by Freepik from [www.flaticon.com](www.flaticon.com) are licensed under [CC 3.0 BY](http://creativecommons.org/licenses/by/3.0/)
