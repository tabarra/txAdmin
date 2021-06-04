debugModeEnabled = false

function debugPrint(...)
  local args = {...}
  local appendedStr = ''
  if debugModeEnabled then
    for _, v in ipairs(args) do
      appendedStr = appendedStr .. ' ' .. tostring(v)
    end
    local msgTemplate = '^3[txAdminMenu]^0%s'
    local msg = msgTemplate:format(appendedStr)
    print(msg)
  end
end

CreateThread(function()
  debugModeEnabled = (GetConvar('txAdminMenu-debugMode', 'false') == 'true')
end)
