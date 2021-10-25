# In-Game Menu

txAdmin v4.0.0 introduced an in-game menu equipped with common admin functionality, 
an online player browser, and a slightly trimmed down version of the web panel.

You can find a short preview video [here](https://www.youtube.com/watch?v=jWKg0VQK0sc)

## Beta Instructions

There are currently a couple of requirements that your server must 
meet in order to test the menu while in beta, these requirements *may* change
before the beta is concluded.

* OneSync **must** be enabled.
* `+setr txEnableMenuBeta true` needs to be included within your FXServer additional 
  arguments. (txAdmin > Settings > FXServer > Additional Arguments)

If you encounter any bugs that you wish to report, please visit our Discord and use the
`#menu-feedback` channel.

## Accessing the Menu

You can access the menu in-game by using the command `/tx` or `/txadmin`, alternatively
you can also assign a keybind by going to Settings > Key Bindings > FiveM and assigning 
a keybind to the option with `Open the txAdmin Menu (monitor)`.

### Permissions
Anybody who you would like to give permissions to open the menu in-game, must have a txAdmin
account with either their Discord or FiveM identifiers tied to it.

***If you do not have any of these identifiers attached. You will not be able to access the 
menu***

You can further control the menu options accessible to admins by changing their permissions
in the admin manager as shown below

![img](https://i.tasoagc.dev/qdt9)

## Convars
The txAdmin menu has a variety of different convars that can alter the default behavior
of the menu

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

**txAdminMenu-alignRight**
* Description: Whether to align the menu to the right of the screen instead of the left.
* Default: 0
* Usage: `+set txAdminMenu-alignRight 1`

### Legacy Convars
ConVar's that were previously available in older versions but have been
removed. They are here for developer reference but you should **not**,
try and utilize them.

**txAdminMenu-updateInterval (removed in v4.7.0)**
* Description: Controls the interval in which players are updated for each online
  admin. *Increasing this can improve client performance but will make updates to
  the players page slower*
* Default: 5000
* Usage: `+set txAdminMenu-updateInterval 10000`

## Commands
**tx | txadmin**
* Description: Will toggle the in-game menu. This command has an optional argument of a player id that will 
quickly open up the target player's info modal.
* Usage: `/tx (playerID)`, `/txadmin (playerID)`
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

## Events
**txAdmin:healedPlayer**
- Domain: `Server`
- Handler Arguments: `playerId: string`
- Description: This event is emitted whenever a heal event is triggered for
  a player/whole server. It will pass an argument containing the targets server 
  ID.

*Note: Whenever txAdmin is targeting healing on all players, it will emit -1 for serverId*

## Troubleshooting menu access

If you type `/tx` and nothing happens, your menu is probably disabled.  
If you see a red message like [this](https://i.imgur.com/G83uTNC.png) and you are registered on txAdmin, do the following:
- In txAdmin Live Console, type `txAdmin-debug 1`;
- In your game F8 console, type `txAdmin-reauth`;
- Read the message printed on console for more information.

## Development
You can find development instructions regarding the menu [here.](https://github.com/tabarra/txAdmin/blob/master/docs/development.md#menu-development)

## FAQ
- **Q**: Why don't the 'Heal' options revive a player when using MY_RANDOM_FRAMEWORK_HERE?
- **A**: Many frameworks independently handle a "dead" state for a player, meaning
  the menu is unable to reset this state in an resource agnostic form directly. To establish compatibility 
  with any framework, txAdmin will emit an [event](https://github.com/tabarra/txAdmin/blob/develop/docs/development.md#events) 
  for developers to handle.
