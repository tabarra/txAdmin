# Custom Events

txAdmin sends **server events** to allow for integration of some functionalities with other resources.
The event name will be `txAdmin:events:<name>` and the first (and only) parameter will be a table that may contain relevant data.  
> **Important:** do not fully rely on events where consistency is key since they may be executed while the server is not online therefore your resource would not be notified about it. For instance, while the server is stopped one could whitelist or ban player identifiers.


## txAdmin:events:scheduledRestart (v3.2)
Broadcasted automatically `[30, 15, 10, 5, 4, 3, 2, 1]` minutes before a scheduled restart.  
Can be used with the convar `txAdmin-hideDefaultScheduledRestartWarning` to display a custom warning notification.  
Event Data:
- `secondsRemaining`: The number of seconds before the scheduled restart.  
- `translatedMessage`: The translated message to show on the announcement.

Example usage on ESX v1.2:
```lua
ESX = nil
TriggerEvent('esx:getSharedObject', function(obj) ESX = obj end)

AddEventHandler('txAdmin:events:scheduledRestart', function(eventData)
    if eventData.secondsRemaining == 60 then
        CreateThread(function()
            Wait(45000)
            print("15 seconds before restart... saving all players!")
            ESX.SavePlayers(function()
                -- do something
            end)
        end)
    end
end)
```


## txAdmin:events:playerKicked (v3.7)
Broadcasted when a player is kicked using txAdmin.  
Event Data:
- `target`: The id of the player that was kicked.
- `author`: The name of the admin.
- `reason`: The reason of the kick.


## txAdmin:events:playerWarned (v3.7)
Broadcasted when a player is warned using txAdmin.  
Can be used with the convar `txAdmin-hideDefaultWarning` to display custom warning.  
Event Data:
- `target`: The id of the player that was warned.
- `author`: The name of the admin.
- `reason`: The reason of the warn.
- `actionId`: The ID of this action.


## txAdmin:events:playerBanned (v3.7)
Broadcasted when a player is banned using txAdmin.  
On update v5.0.0 the field `target` was replaced by `targetNetId` and `targetIds`.  
Event Data:
- `author`: The name of the admin.
- `reason`: The reason of the ban.
- `actionId`: The ID of this action.
- `expiration`: The timestamp for this ban expiration, for `false` if permanent. Added in txAdmin v4.9.
- `durationInput`: xxx. Added in v5.0.
- `durationTranslated`: xxx or `null`. Added in v5.0.
- `targetNetId`: The netid of the player that was banned, or `null` if a ban was applied to identifiers only. Added in v5.0.
- `targetIds`: The identifiers that were banned. Added in v5.0.
- `targetHwids`: The hardware identifiers that were banned. Might be an empty array. Added in v6.0.
- `targetName`: The clean name of the banned player, or `identifiers` if ban was applied to ids only (legacy ban). Added in v5.0.
- `kickMessage`: The message to show the player as a kick reason. Added in v5.0.


## txAdmin:events:playerWhitelisted (v3.7)
This event was deprecated on v5.0.0, and on v5.2.0 new events were added to replace this one.

## txAdmin:event:configChanged (v4.0)
Broadcasted when the txAdmin settings change in a way that could be relevant for the server.   
Event Data: this event has no data.  
At the moment, this is only used to signal the txAdmin in-game Menu if the configured language has changed, and can be used to easily test custom language files without requiring a server restart. 

## txAdmin:events:healedPlayer (v4.8)
Broadcasted when a heal event is triggered for a player/whole server.  
This is most useful for servers running "ambulance job" or other resources that keep a player unconscious even after the health being restored to 100%.  
Event Data:
- `id`: The ID of the healed player, or `-1` if the entire server was healed.

## txAdmin:events:announcement (v4.8)
Broadcasted when an announcement is made using txAdmin.  
Can be used with the convar `txAdmin-hideDefaultAnnouncement` to display custom announcement notifications.  
Event Data:
- `author`: The name of the admin or `txAdmin`.
- `message`: The message of the broadcast.

## txAdmin:events:serverShuttingDown (v4.15)
Broadcasted when the server is about to shut down.  
This can be triggered in a scheduled and unscheduled stop or restart, by an admin or by the system.  
Event Data:
- `delay`: How many milliseconds txAdmin will wait before killing the server process.
- `author`: The name of the admin or `txAdmin`.
- `message`: The message of the broadcast.

## txAdmin:events:playerDirectMessage (v5.0)
Broadcasted when an admin DMs a player.
Can be used with the convar `txAdmin-hideDefaultDirectMessage` to display custom direct message notifications.  
Event Data:
- `target`: The id of the player to receive the DM.
- `author`: The name of the admin.
- `message`: The message content.

## txAdmin:events:actionRevoked (v5.0)
Broadcasted when an admin revokes a database action (ex. ban, warn).  
Event Data:
- `actionId`: The id of the player to receive the DM.
- `actionType`: The type of the action that was revoked.
- `actionReason`: The action reason.
- `actionAuthor`: The name of the admin that issued the action.
- `playerName`: name of the player that received the action, or `false` if doesn't apply.
- `playerIds`: Array containing all identifiers (ex. license, discord, etc.) this action applied to.
- `playerHwids`: Array containing all hardware ID tokens this action applied to. Might be an empty array. Added in v6.0.
- `revokedBy`: The name of the admin that revoked the action.

## txAdmin:events:skippedNextScheduledRestart (v5.2)
Broadcasted when an admin skips the next scheduled restart.  
Event Data:
- `secondsRemaining`: The number of seconds before the previously scheduled restart.  
- `temporary`: If it was a temporary scheduled restart or one configured in the settings page.

## txAdmin:events:whitelistPlayer (v5.2)
Broadcasted when a player is whitelisted, or has the whitelisted status revoked.  
This event is only fired when the player is already registered, and is not related to whitelist requests or approved whitelists pending join.  
Event Data:
- `action`: `added`/`removed`.
- `license`: The license of the player.
- `playerName`: The player display name.
- `adminName`: Name of the admin that performed the action.

## txAdmin:events:whitelistPreApproval (v5.2)
Broadcasted when manually adding some identifier to the whitelist pre-approvals, meaning that as soon as a player with this identifier connects to the server, they will be saved to the database as a whitelisted player (without triggering `txAdmin:events:whitelistPlayer`).  
This event is not gonna be broadcasted when a whitelist request is approved, for that use `txAdmin:events:whitelistRequest`.
This can be done in the Whitelist Page, or using the `/whitelist <member>` Discord bot slash command.  
Event Data:
- `action`: `added`/`removed`.
- `identifier`: The identifier that was pre-approved (eg. `discord:xxxxxx`).
- `playerName?`: The player display name, except when action is `removed`.
- `adminName`: Name of the admin that performed the action.

## txAdmin:events:whitelistRequest (v5.2)
Broadcasted whenever some event related to the whitelist requests happen.  
Event Data:
- `action`: `requested`/`approved`/`denied`/`deniedAll`.
- `playerName?`: The player display name, except when action is `deniedAll`.
- `requestId?`: The request ID (eg. `Rxxxx`), except when action is `deniedAll`.
- `license?`: The license of the player/requester, except when action is `deniedAll`.
- `adminName?`: Name of the admin that performed the action, except when action is `requested`.

## txAdmin:events:adminAuth (v6.0.1)
Broadcasted whenever an admin is authenticated in game, or loses the admin permissions.  
This event is particularly useful for anti-cheats to be able to ignore txAdmin admins.  
Event Data:
- `netid` (number): The ID of the player or -1 when revoking the permission of all admins (forced reauth).
- `isAdmin` (boolean): If the player is an admin or not.
- `username?` (string): The txAdmin username of the admin that was just authenticated.
