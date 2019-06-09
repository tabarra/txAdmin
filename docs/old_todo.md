## Old TODO:
- [x] **Improve the README.**
- [x] Get the correct PID through pidtree (should we get only the correct fxserver's pid, or sum all the processes? This code usually takes about 40MB so it might be significant enough to include)
- [x] Put the configuration into a json and set default values
- [x] Write the admin log component (or part of another?)
- [x] Separate the web routes
- [x] **Add a simple rate limiter (MUST)**
- [x] Write some documentation
- [x] **Automatically check for updates (MUST)**
- [x] Auto restart on schedule (for the unstable servers out there)
- [x] Auto restart if the monitor fails X times in the last Y seconds 
- [x] Better error handling for the discord module
  
And more...
- [x] Console verbosity settings?
- [x] Fix what happens when you stop or start a server that is already running.
- [x] Add the config file to the arguments so we can run multiple servers in the same installation folder only be specifying it in runtime like `npm start server01.json`
- [x] Protect the log with password. For now I will just disable IP logging.
- [x] **Add discord integration**
