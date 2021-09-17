if (GetConvar('txEnableMenuBeta', 'false') ~= 'true') then
  return
end

local function sendFreezeAlert(isFrozen)
  if isFrozen then
    sendPersistentAlert('freeze-status', 'warning', 'nui_menu.frozen.was_frozen', true)
  else
    clearPersistentAlert('freeze-status')
  end
end

RegisterNUICallback('togglePlayerFreeze', function(data, cb)
  local targetPlayerId = tonumber(data.id)
  if targetPlayerId == GetPlayerServerId(PlayerId()) then
      return sendSnackbarMessage('error', 'nui_menu.player_modal.actions.interaction.spectate_yourself', true)
  end

  TriggerServerEvent('txAdmin:menu:freezePlayer', targetPlayerId)
  cb({})
end)

RegisterNetEvent('txAdmin:menu:freezeResp', function(isFrozen)
  local localeKey = isFrozen and 'nui_menu.frozen.froze_player' or 'nui_menu.frozen.unfroze_player'
  sendSnackbarMessage('info', localeKey, true)
end)

RegisterNetEvent('txAdmin:menu:freezePlayer', function(isFrozen)
  debugPrint('Frozen: ' .. tostring(isFrozen))
  FreezeEntityPosition(PlayerPedId(), isFrozen)
  sendFreezeAlert(isFrozen)
end)
