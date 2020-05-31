## Permission System
The permission system allows you to control which admins can perform which actions.
For instance you can allow one admin to only view the console and kick players, but not restart the server and execute arbitrary commands.
The permissions are saved in the `txData/admins.json` file and can be edited through the *Admin Manager* page by the Master admin, or users with `all_permissions` or `manage.admins` permissions.

### Available Permissions
- `all_permissions`: Root permission that allows the user to perform any action. When set, this will remove all other permissions;
- `manage.admins`: Permission to create, edit and remove other admin accounts;
- `settings.view`: Permission to view the settings. Tokens will be redacted;
- `settings.write`: Permission to edit the settings;
- `control.server`: Permission to start/stop/restart the server;
- `commands.resources`: Permission to start/ensure/restart/stop resources;
- `players.ban`: Permission to ban/unban players;
- `players.kick`: Permission to kick one or all players;
- `players.message`: Permission to to send admin messages via DM or Broadcast command;
- `players.warn`: Permission to warn players;
- `players.whitelist`: Permission to whitelist or remove the whitelist of players;
- `console.view`: Permission to view the Live Console;
- `console.write`: Permission to execute commands in the Live Console.
- `server.cfg.editor`: Permission to view and edit the FXServer CFG File (eg `server.cfg`).
