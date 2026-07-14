-- =============================================
--  Truly global
-- =============================================

function GetConvarBool(cvName, defaultConvarValue)
  if not cvName then
    return false
  elseif defaultConvarValue then
    return (GetConvar(cvName, 'true') == 'true')
  else
    return (GetConvar(cvName, 'false') == 'true')
  end
end

-- -- Tests for GetConvarBool
-- print("==========================")
-- print('unknown convar')
-- print(GetConvarBool2('xxx', true)) -- true
-- print(GetConvarBool2('xxx', false)) -- false
-- print(GetConvarBool2('xxx')) -- false
-- print('known convar')
-- SetConvar('yyy', 'true')
-- print(GetConvarBool2('yyy', true)) -- true
-- print(GetConvarBool2('yyy', false)) -- true
-- print(GetConvarBool2('yyy')) -- true 
-- print('known convar, but with a false value')
-- SetConvar('yyy', 'false')
-- print(GetConvarBool2('yyy', false)) -- false
-- print(GetConvarBool2('yyy', true)) -- false
-- print(GetConvarBool2('yyy')) -- false
-- print("==========================")

-- Setting game-specific global vars
local envName = GetGameName()
IS_REDM = false
IS_FIVEM_GEN8 = false
IS_FIVEM_GEN9 = false
if envName == 'fxserver' then
  local gameConvar = GetConvar('gamename', 'gta5')
  if gameConvar == 'redm' then
    GAME_NAME = 'redm'
  elseif gameConvar == 'gta5' then
    IS_FIVEM_GEN8 = true
    GAME_NAME = 'fivem'
  elseif gameConvar == 'gta5enhanced' then
    IS_FIVEM_GEN9 = true
    GAME_NAME = 'fivem'
  else
    error("Unknown gamename convar: " .. gameConvar)
  end
else
  GAME_NAME = envName
  if GAME_NAME == 'fivem' then
    IS_FIVEM_GEN9 = type(IsGameEnhancedVersion) == "function" and IsGameEnhancedVersion()
    IS_FIVEM_GEN8 = not IS_FIVEM_GEN9
  end
end
IS_FIVEM = GAME_NAME == 'fivem'
IS_REDM = GAME_NAME == 'redm'

-- print("Shared vars:", json.encode({
--   envName=envName,
--   gameConvar=GetConvar('gamename', 'invalid'),
--   GAME_NAME=GAME_NAME,
--   IS_REDM=IS_REDM,
--   IS_FIVEM_GEN8=IS_FIVEM_GEN8,
--   IS_FIVEM_GEN9=IS_FIVEM_GEN9,
--   IS_FIVEM=IS_FIVEM,
-- }, {indent=true}))

-- Setting global enable/disable variable for all sv_*.lua files
-- NOTE: not available on client
TX_SERVER_MODE = GetConvarBool('txAdminServerMode')

-- Setting global enable/disable variable for all menu-related files
TX_MENU_ENABLED = GetConvarBool('txAdmin-menuEnabled')

-- Setting global debug variable for all files
-- On the client, this is updated by receiving a `txcl:setDebugMode` event.
-- On the server, this is updated by running txaSetDebugMode on Live Console
TX_DEBUG_MODE = GetConvarBool('txAdmin-debugMode')
-- TX_DEBUG_MODE = true --DEBUG:remove

--- Internal helper to format txAdmin console messages
local function _formatTxString(args)
  local appendedStr = ''
  for _, v in ipairs(args) do
    appendedStr = appendedStr .. ' ' .. (type(v)=="table" and json.encode(v) or tostring(v))
  end
  return appendedStr
end

--- Prints formatted string to console
function txPrint(...)
  local msg = ('^5[txAdmin]^0%s^0'):format(_formatTxString({...}))
  print(msg)
end

function txPrintError(...)
  local msg = ('^5[txAdmin]^1%s^0'):format(_formatTxString({...}))
  print(msg)
end

--- Prints formatted string to console if debug mode is enabled
function debugPrint(...)
  if TX_DEBUG_MODE then
    txPrint(...)
  end
end


--- Finds the index of a table element
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


---Shortcut for calculating a ped % health
---@param ped any
---@return integer
function GetPedHealthPercent(ped)
  return math.floor((GetEntityHealth(ped) / GetEntityMaxHealth(ped)) * 100)
end
