# fivem-fxadmin
FiveM FXServer Admin - remotely manage your GTA5 FiveM Server

## TODO:
- [ ] **Write a decent README.**
- [ ] Get the correct PID through pidtree
- [x] Put the configuration into a json and set default values
- [ ] Write the admin log component (or part of another?)
- [ ] Separate the web routes
- [ ] Add custom commands to the config file
- [ ] Add a simple rate limiter and perhaps add *morgan*
- [ ] Write some documentation

And more...
- [x] Console verbosity settings? (**partial**)
- [ ] Check what happens when you stop or start a server thet is already running. Should this.fxServer be set to null?
- [ ] Separate the DANGER ZONE commands into a separate tab with confirmation dialog?
- [ ] We have data, we should plot it into a graph...
- [ ] Add the config file to the arguments so we can run multiple servers in the same installation folder only be specifying it in runtime like `node src/main.js server01.json`
