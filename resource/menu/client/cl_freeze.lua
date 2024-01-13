-- Prevent running if menu is disabled
if not TX_MENU_ENABLED then return end

-- =============================================
--  This file contains all player freeze logic
-- =============================================

local function sendFreezeAlert(isFrozen)
  if isFrozen then
    sendPersistentAlert('freeze-status', 'warning', 'nui_menu.frozen.was_frozen', true)
  else
    clearPersistentAlert('freeze-status')
  end
end

RegisterSecureNuiCallback('togglePlayerFreeze', function(data, cb)
  local targetPlayerId = tonumber(data.id)
  if targetPlayerId == GetPlayerServerId(PlayerId()) then
      return sendSnackbarMessage('error', 'nui_menu.player_modal.actions.interaction.notifications.freeze_yourself', true)
  end

  TriggerServerEvent('txsv:req:freezePlayer', targetPlayerId)
  cb({})
end)

RegisterNetEvent('txcl:freezePlayerOk', function(isFrozen)
  local localeKey = isFrozen and 'nui_menu.frozen.froze_player' or 'nui_menu.frozen.unfroze_player'
  sendSnackbarMessage('info', localeKey, true)
end)

RegisterNetEvent('txcl:setFrozen', function(isFrozen)
  debugPrint('Frozen: ' .. tostring(isFrozen))
  --NOTE: removed the check for vehicle, but could be done with 
  -- IsPedInAnyVehicle for vehicles and IsPedOnMount for horses
  local playerPed = PlayerPedId()
  TaskLeaveAnyVehicle(playerPed, 0, 16)
  FreezeEntityPosition(playerPed, isFrozen)
  sendFreezeAlert(isFrozen)
end)
