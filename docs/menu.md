## In-Game Menu

txAdmin v4.0.0 introduced an in-game menu equipped with common admin functionality, 
an online player browser, and a slightly trimmed down version of the web panel.

You can find a short preview video [here](https://www.youtube.com/watch?v=jWKg0VQK0sc)

### Beta Instructions

There are currently a couple of requirements that your server must 
meet in order to test the menu while in beta, these requirements *may* change
before the beta is concluded.

* OneSync **must** be enabled.
* `+setr txEnableMenuBeta true` needs to be included within your FXServer additional 
  arguments. (txAdmin > Settings > FXServer > Additional Arguments)

If you encounter any bugs that you wish to report, please visit our Discord and use the
`#menu-feedback` channel.

### Accessing the Menu

You can access the menu in-game by using the command `/tx` or `/txadmin`, alternatively
you can also assign a keybind by going to Settings > Key Bindings > FiveM and assigning 
a keybind to the option with `Open the txAdmin Menu (monitor)`.

#### Permissions
Anybody who you would like to give permissions to open the menu in-game, must have a txAdmin
account with either their Discord or FiveM identifiers tied to it.

***If you do not have any of these identifiers attached. You will not be able to access the 
menu***

You can further control the menu options accessible to admins by changing their permissions
in the admin manager as shown below

![img](https://i.tasoagc.dev/qdt9)

### Convars
The txAdmin menu has a variety of different convars that can alter the default behavior
of the menu

**txAdminMenu-updateInterval**
* Description: Controls the interval in which players are updated for each online 
  admin. *Increasing this can improve client performance but will make updates to 
  the players page slower*
* Default: 5000 
* Usage: `+set txAdminMenu-updateInterval 10000`

**txAdminMenu-pageKey**
* Description: Will change the key used for changing pages in the menu. This value must be 
  the exact browser key code for your preferred key. You can use [this](https://keycode.info/) 
  website and the `event.code` section to find it.
* Default: Tab
* Usage: `+set txAdminMenu-pageKey Insert`

**txAdminMenu-debugMode**
* Description: Will toggle debug printing on the server and client.
* Default: false
* Usage: `+setr txAdminMenu-debugMode true`

**txAdminMenu-playerIdDistance**
* Description: The distance in which Player IDs become visible, if toggled on.
* Default: 150
* Usage: `+setr txAdminMenu-playerIdDistance 100`

### Commands
**tx | txadmin**
* Description: Will toggle the in-game menu
* Usage: `/tx`, `/txadmin`
* Required Perm: `Must be an admin registered in the Admin Manager`

**txAdmin-debug**
* Description: Will toggle on debug mode without requiring a restart. (Can be used from console)
* Usage: `/txAdmin-debug [0 | 1]`
* Required Perm: `control.server`

**txAdmin-reauth**
* Description: Will retrigger the reauthentication process. **This only works if the server is 
  started with Debug Mode**
* Usage: `/txAdmin-reauth`
* Required Perm: `none`

### Troubleshooting menu access

If you type `/tx` and nothing happens, your menu is probably disabled.  
If you see a red message like [this](https://i.imgur.com/G83uTNC.png) and you are registered on txAdmin, do the following:
- In txAdmin Live Console, type `txAdmin-debug 1`;
- In your game F8 console, type `txAdmin-reauth`;
- Read the message printed on console for more information.

### Development

The txAdmin Menu is a Lua + TypeScript React project. Ensure you have all the dependencies by running 
`npm i` in the root directory. 

#### Hot Reloading Dev Environments

To run the menu in the browser you can use the `dev:menu` script. This will hot reload, everytime
a change is made.

```bash
npm run dev:menu
```

To run the menu in game you can use the `dev:menu:game` script, this will also hot reload the 
build process, but you must also manually restart the monitor resource each time.
```bash
npm run dev:menu:game
```

#### General Structure

**Lua**: You can find the majority of the relevant Lua scripts in the `scripts/menu` directory.

**React/Typescript**: The source code for the React application can be found in the `./menu`
directory.
