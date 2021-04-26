# Custom Events

Starting in v3.2, **txAdmin** now has the ability to trigger server events.  
The event name will be `txAdmin:events:<name>` and the first (and only) parameter will be a table that may contain relevant data.


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
Event Data:
- `target`: The id of the player that was banned.
- `author`: The name of the admin.
- `reason`: The reason of the ban.
- `actionId`: The ID of this action.


## txAdmin:events:playerWhitelisted (v3.7)
Called when a player is whitelisted using txAdmin.
Event Data:
- `author`: The name of the admin.
- `actionId`: The ID of this action.
- `target`: The reference of this whitelist. Can be "license:" prefixed license or a whitelist request ID.
