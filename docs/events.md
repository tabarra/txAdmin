# Custom Events

Starting in v3.2, **txAdmin** now has the ability to trigger server events.  
The event name will be `txAdmin:events:<name>` and the first (and only) parameter will be a table that may contain relevant data.  
> **Important:** do not fully rely on events where consistency is key since they may be executted while the server is not online therefore your resource would not be notified about it. For instance, while the server us stopped one could whitelist or ban player identifiers.


## txAdmin:events:scheduledRestart (v3.2)
Called automatically `[30, 15, 10, 5, 4, 3, 2, 1]` minutes before a scheduled restart, as well as the times configured in the settings page.  
Event Data:
- `secondsRemaining`: The number of seconds before the scheduled restart.  

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
Called when a player is kicked using txAdmin.  
Event Data:
- `target`: The id of the player that was kicked.
- `author`: The name of the admin.
- `reason`: The reason of the kick.


## txAdmin:events:playerWarned (v3.7)
Called when a player is warned using txAdmin.  
Event Data:
- `target`: The id of the player that was warned.
- `author`: The name of the admin.
- `reason`: The reason of the warn.
- `actionId`: The ID of this action.


## txAdmin:events:playerBanned (v3.7)
Called when a player is banned using txAdmin.  
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
- `targetName`: The clean name of the banned player, or `identifiers` if ban was applied to ids only (legacy ban). Added in v5.0.
- `kickMessage`: The message to show the player as a kick reason. Added in v5.0.


## txAdmin:events:playerWhitelisted (v3.7)
This event was deprecated on v5.0.0.

## txAdmin:event:configChanged (v4.0)
Called when the txAdmin settings change in a way that could be relevant for the server.   
Event Data: this event has no data.  
At the moment, this is only used to signal the txAdmin in-game Menu if the configured language has changed, and can be used to easily test custom language files without requiring a server restart. 

## txAdmin:events:healedPlayer (v4.8)
Called when a heal event is triggered for a player/whole server.  
This is most useful for servers running "ambulance job" or other resources that keep a player unconscious even after the health being restored to 100%;  
Event Data:
- `id`: The ID of the healed player, or `-1` if the entire server was healed.

## txAdmin:events:announcement (v4.8)
Called when an announcement is made using txAdmin.  
Event Data:
- `author`: The name of the admin or `txAdmin`.
- `message`: The message of the broadcast.

## txAdmin:events:serverShuttingDown (v4.15)
Called when the server is about to shut down.  
This can be triggered in a scheduled and unscheduled stop or restart, by an admin or by the system.
Event Data:
- `delay`: How many milliseconds txAdmin will wait before killing the server process.
- `author`: The name of the admin or `txAdmin`.
- `message`: The message of the broadcast.

## txAdmin:events:playerDirectMessage (v5.0)
Called when an admin DMs a player.
Event Data:
- `target`: The id of the player to receive the DM.
- `author`: The name of the admin.
- `message`: The message content.

## txAdmin:events:actionRevoked (v5.0)
Called when an admin revokes a database action (ex. ban, warn).
Event Data:
- `actionId`: The id of the player to receive the DM.
- `actionType`: The type of the action that was revoked.
- `actionReason`: The action reason.
- `actionAuthor`: The name of the admin that issued the action.
- `playerName`: name of the player that received the action, or `false` if doesn't apply.
- `playerIds`: Array containing all identifiers (ex. license, discord, etc.) this action applied to.
- `revokedBy`: The name of the admin that revoked the action.
