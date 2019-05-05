# FiveM-FXAdmin
This is a very simple tool to help you manage your FiveM server.  

One of the problems I noticed with the servers out there is that the "bases" are usually very tightly coupled with the FXServer build, this tool helps you use or test multiple builds at the same time on the same resources folder.  

**Compatibility:** This project is compatible with OneSync (more than 32 slots server). Linux compatibility is in progress.


## Installation
First, make sure you have:
- NodeJS v10+ (with npm)
- FXServer (duh)
- One TCP listen port opened for the web server

Then to install:
```bash
$ git clone https://github.com/tabarra/fivem-fxadmin
$ cd fivem-fxadmin
$ npm install
```
Copy your `config-template.json` to `config.json` and modify it according to your installation.  
Do the same thing to your `admins-template.json`. To generate the hashed password, you can use tools like [this](https://www.browserling.com/tools/bcrypt) and [this](https://bcrypt-generator.com) or even [this one](https://passwordhashing.com/BCrypt).  
  
To run FXAdmin:
```bash
$ node src/main.js config.json
```

To run multiple servers with the same base and FXAdmin installation, just duplicate your config.json and change the ports. Two instances of FXAdmin cannot be running in the same web server port.


## TODO
MUST before the release:
- [ ] **Improve the README.**
- [x] Get the correct PID through pidtree (should we get only the correct fxserver's pid, or sum all the processes? This code usually takes about 40MB so it might be significant enough to include)
- [x] Put the configuration into a json and set default values
- [x] Write the admin log component (or part of another?)
- [x] Separate the web routes
- [ ] Add custom commands to the config file
- [ ] Add a simple rate limiter and perhaps add *morgan*
- [x] Write some documentation
- [ ] Automatically check for updates. 

And more...
- [x] Console verbosity settings? (**WIP**)
- [ ] Add a `more info` tab and include some config variables, and the complete PID breakdown
- [ ] Check what happens when you stop or start a server thet is already running. Should this.fxServer be set to null?
- [ ] Separate the DANGER ZONE commands into a separate tab with confirmation dialog?
- [ ] We have data, we should plot it into a graph...
- [x] Add the config file to the arguments so we can run multiple servers in the same installation folder only be specifying it in runtime like `node src/main.js server01.json`
- [ ] Protect the log with password. For now I will just disable IP logging.
- [ ] Write a simple `manage_admins.js` script to help with the process. The current `/getHash?pwd=xxx` is counterintuitive at best.
- [ ] Get JSONC compatibility. Inline documentation for the configs would be great.
- [ ] Add machine performance data to the panel. Or not, perhaps thats a little too much into Grafana's land.



## License & credits
- This project is licensed under the [MIT License](https://github.com/tabarra/fivem-fxadmin/blob/master/LICENSE).
- Favicons made by Freepik from [www.flaticon.com](www.flaticon.com) are licensed under [CC 3.0 BY](http://creativecommons.org/licenses/by/3.0/)
