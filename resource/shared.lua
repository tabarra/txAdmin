-- =============================================
--  Truly global
-- =============================================

function GetConvarBool(cvName)
  return (GetConvar(cvName, 'false') == 'true')
end

-- Setting global enable/disable variable for all sv_*.lua files
-- NOTE: not available on client
TX_SERVER_MODE = GetConvarBool('txAdminServerMode')

-- Setting global enablle/disable variable for all menu-related files
TX_MENU_ENABLED = GetConvarBool('txAdmin-menuEnabled')

-- =============================================
--  Server mode only
-- =============================================

debugModeEnabled = false

CreateThread(function()
  debugModeEnabled = GetConvarBool('txAdmin-menuDebug')
end)

---FIXME: description
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

--- Used whenever we want to convey a message as from txAdminMenu without
--- being in debug mode.
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

---FIXME: description
---@param tgtTable table
---@param value any
---@return integer
function tableIndexOf(tgtTable, value)
  for i=1, #tgtTable do
    debugPrint(('tgtTableVal: %s, value: %s'):format(tgtTable[i], value))
    if tgtTable[i] == value then
      return i
    end
  end
  return -1
end
