## Permission System
Introduced in **txAdmin** v1.5.0, the permission system allows you to control which admins can perform which actions.
For instance you can allow one admin to only view the console and kick players, but not restart the server and execute arbitrary commands.
The permissions are saved in the `data/admins.json` file and can be edited through the *Admin Manager* page by users with `all` or `manage.admins` permissions.
Any accounts created with the `admin-add` script will be created with all permissions.

**Note:** There is no "root" account, so an account with the `manage.admins` permission could delete the account that created him.

### Available Permissions
- `all`: Root permission that allows the user to perform any action. When set, this will remove all other permissions;
- `manage.admins`: Permission to create, edit and remove other admin accounts;
- `settings.view`: Permission to view the settings;
- `settings.write`: Permission to edit the settings;
- `control.server`: Permission to start/stop/restart the server;
- `commands.message`: Permission to send admin messages via DM or Broadcast command;
- `commands.kick`: Permission to kick one or all players;
- `commands.resources`: Permission to start/ensure/restart/stop resources;
- `commands.custom`: Permission to execute any of the custom commands (**not implemented yet**);
- `console.view`: Permission to view the Live Console;
- `console.write`: Permission to execute commands in the Live Console.
