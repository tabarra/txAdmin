debugModeEnabled = false

CreateThread(function() 
  debugModeEnabled = (GetConvar('TXADMIN_MENU_DEBUG', 'false') == 'true') 
end)

function debugPrint(message)
  if debugModeEnabled then
    local msgTemplate = '^3[txAdminMenu]^0 %s'
    local msg = msgTemplate:format(message)
    print(msg)
  end
end
