--Check Environment
if GetConvar('txAdminServerMode', 'false') ~= 'true' then
  return
end

RegisterNetEvent('txAdmin:menu:playerModeChanged', function(mode)
  local src = source
  if mode ~= 'godmode' and mode ~= 'noclip' and mode ~= 'none' then
    debugPrint("Invalid player mode requested by " .. GetPlayerName(src) .. " (mode: " .. (mode or 'nil'))
    return
  end

  local allow = PlayerHasTxPermission(src, 'players.playermode')
  TriggerEvent("txaLogger:menuEvent", src, "playerModeChanged", allow, mode)
  if allow then
    TriggerClientEvent('txAdmin:menu:playerModeChanged', src, mode)
  end
end)

RegisterNetEvent('txsv:syncPtfxEffect', function(playersToTgt)
  local src = source
  -- debugPrint('Syncing ptfx change for following table')
  -- debugPrint(json.encode(playersToTgt))
  -- We need to make sure source is allowed to change player modes
  -- otherwise any client could call this event and have ptfx replicated
  -- upon clients nearby
  local allow = PlayerHasTxPermission(src, 'players.playermode')
  if allow then
    for _, v in ipairs(playersToTgt) do
      -- Make sure not to trigger the event on the calling clients table
      if v ~= src then
        TriggerClientEvent('txcl:syncPtfxEffect', v, src)
      end
    end
  end
end)
