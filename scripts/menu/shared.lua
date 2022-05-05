debugModeEnabled = false

function debugPrint(...)
  local args = {...}
  local appendedStr = ''
  if debugModeEnabled then
    for _, v in ipairs(args) do
      appendedStr = appendedStr .. ' ' .. (type(v)=="table" and json.encode(v) or tostring(v))
    end
    local msgTemplate = '^3[txAdminMenu]^0%s^0'
    local msg = msgTemplate:format(appendedStr)
    print(msg)
  end
end

-- Used whenever we want to convey a message as from txAdminMenu without
-- being in debug mode.
function txPrint(...)
  local args = {...}
  local appendedStr = ''
  for _, v in ipairs(args) do
    appendedStr = appendedStr .. ' ' .. tostring(v)
  end
  local msgTemplate = '^3[txAdminMenu]^0%s^0'
  local msg = msgTemplate:format(appendedStr)
  print(msg)
end

CreateThread(function()
  debugModeEnabled = (GetConvar('txAdmin-menuDebug', 'false') == 'true')
end)
