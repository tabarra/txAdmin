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

local isPlayerFrozen = false

RegisterNetEvent('txcl:setFrozen', function(isFrozen)
  debugPrint('Frozen: ' .. tostring(isFrozen))
  --NOTE: removed the check for vehicle, but could be done with
  -- IsPedInAnyVehicle for vehicles and IsPedOnMount for horses
  local playerPed = PlayerPedId()

  if isFrozen and IsPedInAnyVehicle(playerPed, false) then
    TaskLeaveAnyVehicle(playerPed, 0, 16)
  end

  isPlayerFrozen = isFrozen
  FreezeEntityPosition(playerPed, isFrozen)
  sendFreezeAlert(isFrozen)

  -- Logic to delete vehicle/horse that the player is trying to spawn
  if isFrozen then
    CreateThread(function()
      while isPlayerFrozen do
        if IS_FIVEM then
          if IsPedInAnyVehicle(playerPed, false) then
            local veh = GetVehiclePedIsUsing(playerPed)
            Wait(0)
            if DoesEntityExist(veh) then
              DeleteEntity(veh)
            end
          end
          Wait(100)
        else
          if IS_REDM then
            if IsPedOnMount(playerPed) then
              local horse = GetVehiclePedIsUsing(playerPed)
              Wait(0)
              if DoesEntityExist(horse) then
                DeleteEntity(horse)
              end
            end
            Wait(100)
          end
        end
      end
    end)
  end
end)
