# Custom Events

Starting in v3.2, **txAdmin** now has the ability to trigger server events.  
The event name will be `txAdmin:events:<name>` and the first (and only) parameter will be a table that may contain relevant data.

## txAdmin:events:scheduledRestart
Called automatically `[30, 15, 10, 5, 4, 3, 2, 1]` minutes before a scheduled restart, as well as the times configured in the settings page.  
Arguments:
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

## txAdmin:events:broadcast
Called for whenever an announcement is triggered from the admin panel.  
Arguments:
- `author`: Username of the person triggering the announcement.  
- `announcement`: Announcement text

Example usage:
```lua
AddEventHandler('txAdmin:events:broadcast', function(eventData)
    print(("announcement %s: %s"):format(eventData.author, eventData.announcement))
end)
```
