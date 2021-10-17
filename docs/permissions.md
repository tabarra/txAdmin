## Permission System
The permission system allows you to control which admins can perform which actions.
For instance you can allow one admin to only view the console and kick players, but not restart the server and execute arbitrary commands.
The permissions are saved in the `txData/admins.json` file and can be edited through the *Admin Manager* page by the Master admin, or users with `all_permissions` or `manage.admins` permissions.

### Available Permissions
- `all_permissions`: Root permission that allows the user to perform any action. When set, this will remove all other permissions;
- `manage.admins`: Permission to create, edit and remove other admin accounts;
- `settings.view`: Settings: View (no tokens);
- `settings.write`: Settings: Change;
- `console.view`: Console: View;
- `console.write`: Console: Write;
- `control.server`: Start/Stop/Restart Server;
- `commands.resources`: Start/Stop Resources;
- `server.cfg.editor`: Read/Write server.cfg;
- `txadmin.log.view`: View txAdmin Log;
- `menu.vehicle`: Spawn / Fix Vehicles;
- `players.message`: Announcement / DM;
- `players.whitelist`: Whitelist player;
- `players.warn`: Warn player;
- `players.kick`: Kick player;
- `players.ban`: Ban player;
- `players.heal`: Heal self or everyone;
- `players.playermode`: NoClip / God Mode;
- `players.spectate`: Spectate player;
- `players.teleport`: Teleport self or player;
- `players.trollmenu`: Troll Menu (*not yet available*);
- `players.freeze`: Freeze a players ped;