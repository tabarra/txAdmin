local oneSyncEnabled = false

-- OneSync check
if GetConvar('onesync', 'off') == 'on' or 'legacy' then
  oneSyncEnabled = true
end

RegisterServerEvent('txadmin:menu:checkAccess', function()
  local src = source

  -- Do the accessible verification check here, not sure how you want
  -- to do this Tabarra, but this logic goes here
  local canAccess = true
  TriggerClientEvent('txadmin:menu:setAccessible', src, canAccess)
end)


RegisterServerEvent('txAdmin:menu:healAllPlayers', function()
  -- Verification Check here or cancel
  local src = source

  TriggerClientEvent('txAdmin:menu:healed', -1)
end)


RegisterServerEvent('txAdmin:menu:tpToCoords', function(coords)
  local src = source

  -- Verification check here or cancel

  TriggerClientEvent('txAdmin:menu:tpToCoords', src, coords)
end)

RegisterServerEvent('txAdmin:menu:sendAnnouncement', function(message)
  local src = source

  TriggerClientEvent('chat:addMessage', -1, { 
    color = {255, 0, 0},
    multiline = true,
    args = {"Announcement", message}
  })

  -- Verification check here or cancel
  -- Goes up to txAdmin WebServer for meming
end)