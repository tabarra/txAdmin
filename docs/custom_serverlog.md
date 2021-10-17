# Logging Extra Data

This feature allows you to add logging for custom commands like `/car` and `/tp`.  
To do that, you will need to edit the scripts of those commands to trigger a `txaLogger:CommandExecuted` event.
> **Note: for now this only supports client commands!**

## How to Enable

In the client script, add the following event call inside the command function:

```lua
TriggerServerEvent('txaLogger:CommandExecuted', rawCommand)
```

Where `rawCommand` is a variable containing the full command with parameters.  
You don't NEED to pass `rawCommand`, you can edit this string or pass anything you want.

## Example

In this example, we will log data from the `/car` command from the `CarCommand` script.

```lua
RegisterCommand('car', function(source, args, rawCommand)
    TriggerServerEvent('txaLogger:CommandExecuted', rawCommand) -- txAdmin logging Callback

    local x,y,z = table.unpack(GetOffsetFromEntityInWorldCoords(PlayerPedId(), 0.0, 8.0, 0.5))

    -- there is more code here, no need to edit
end)
```
