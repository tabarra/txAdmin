# Logging
In version v4.6.0, **txAdmin** added support for persistent logging with file rotate, meaning you will have an organized folder (`txData/<profile>/logs/`) containing your log files up to a maximum size and number of days.

> Note: player warn/ban/whitelist actions are not just stored in the Admin Logs, but also on the players database.

## Admin Logs:
Contains log of administrative actions as well as some automated ones like server restarts, bans, warns, settings change, live console input and so on. It does not log the user IP unless if from an authentication endpoint.
- Recent Buffer: None. Methods will read the entire file.
- Interval: 7d
- maxFiles: false
- maxSize: false

## FXServer Console Log:
Contains the log of everything that happens in the fxserver console (`stdin`, `stdout`, `stderr`). Any live console input is prefixed with `> `.
- Recent Buffer: 64~128kb
- Interval: 1d
- maxFiles: 7
- maxSize: 5G

## Server Logs:
Contains all actions that happen inside the server, for example player join/leave/die, chat messages, explosions, menu events, commands. Player sources are kept in the format `[mutex#id] name` where the mutex is an identifier of that server execution. If you search the file for a `[mutex#id]`, the first result will be the player join with all his identifiers available.
- Recent Buffer: 32k events
- Interval: 1d
- maxFiles: 7
- maxSize: 10G

## TODO: System Logs (not yet released):
Contains everything that txAdmin prints on the console.
- Recent Buffer: last 500 lines
- Interval: 1d
- maxFiles: 7
- maxSize: 5G

## Configuring Log Rotate
The log rotation can be configured, so you can choose to store more or less logs according to your needs.  
To configure it, edit your `txData/<profile>/config.json` and add an object inside `logger` with the key being one of `[admin, fxserver, server, console]`. Then add option keys according with the library reference: https://github.com/iccicci/rotating-file-stream#options

Example:
```jsonc
{
  //...
  "logger": {
    "fxserver": {
      "interval": "1d",
      "maxSize": "2G", //max size of rotated files to keep
      "maxFiles": 14 //max number of rotated files to keep
    }
  }
  //...
}
```
