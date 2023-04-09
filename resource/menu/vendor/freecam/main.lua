local Wait = Citizen.Wait
local vector3 = vector3
local IsPauseMenuActive = IsPauseMenuActive
local GetSmartControlNormal = GetSmartControlNormal

local SETTINGS = _G.CONTROL_SETTINGS
local CONTROLS = _G.CONTROL_MAPPING

-------------------------------------------------------------------------------
local function GetSpeedMultiplier()
  local fastNormal = GetSmartControlNormal(CONTROLS.MOVE_FAST)
  local slowNormal = GetSmartControlNormal(CONTROLS.MOVE_SLOW)

  local baseSpeed = SETTINGS.BASE_MOVE_MULTIPLIER
  local fastSpeed = 1 + ((SETTINGS.FAST_MOVE_MULTIPLIER - 1) * fastNormal)
  local slowSpeed = 1 + ((SETTINGS.SLOW_MOVE_MULTIPLIER - 1) * slowNormal)

  local frameMultiplier = GetFrameTime() * 60
  local speedMultiplier = baseSpeed * fastSpeed / slowSpeed

  return speedMultiplier * frameMultiplier
end

local function UpdateCamera()
  if not IsFreecamActive() or IsPauseMenuActive() then
    return
  end

  if not IsFreecamFrozen() then
    local vecX, vecY = GetFreecamMatrix()
    local vecZ = vector3(0, 0, 1)

    local pos = GetFreecamPosition()
    local rot = GetFreecamRotation()

    -- Get speed multiplier for movement
    local speedMultiplier = GetSpeedMultiplier()

    -- Get rotation input
    local lookX = GetSmartControlNormal(CONTROLS.LOOK_X)
    local lookY = GetSmartControlNormal(CONTROLS.LOOK_Y)

    -- Get position input
    local moveX = GetSmartControlNormal(CONTROLS.MOVE_X)
    local moveY = GetSmartControlNormal(CONTROLS.MOVE_Y)
    local moveZ = GetSmartControlNormal(CONTROLS.MOVE_Z)

    -- Calculate new rotation.
    local rotX = rot.x + (-lookY * SETTINGS.LOOK_SENSITIVITY_X)
    local rotZ = rot.z + (-lookX * SETTINGS.LOOK_SENSITIVITY_Y)
    local rotY = rot.y

    -- Adjust position relative to camera rotation.
    pos = pos + (vecX *  moveX * speedMultiplier)
    pos = pos + (vecY * -moveY * speedMultiplier)
    pos = pos + (vecZ *  moveZ * speedMultiplier)

    -- Adjust new rotation
    rot = vector3(rotX, rotY, rotZ)

    -- Update camera
    SetFreecamPosition(pos.x, pos.y, pos.z)
    SetFreecamRotation(rot.x, rot.y, rot.z)

    return pos, rotZ
  end

  -- Trigger a tick event. Resources depending on the freecam position can
  -- make use of this event.
  -- TriggerEvent('freecam:onTick')
end

-------------------------------------------------------------------------------
if IS_REDM then
  local informationTable = {
    text = { 'Faster', 'Slower', 'Fwd/Back', 'Left/Right', 'Down', 'Up' },
    key = { CONTROLS.MOVE_FAST, CONTROLS.MOVE_SLOW, CONTROLS.MOVE_Y, CONTROLS.MOVE_X, CONTROLS.MOVE_Z[2], CONTROLS.MOVE_Z[1] }
  }
  promptGroupId = GetRandomIntInRange(0, 65536)
  for i = 1, 6 do
    local string = CreateVarString(10, 'LITERAL_STRING', informationTable.text[i])
    local prompt = PromptRegisterBegin()
    PromptSetText(prompt, string)
    PromptSetControlAction(prompt, informationTable.key[i])
    PromptSetGroup(prompt, promptGroupId, 0)
    PromptSetEnabled(prompt, true)
    PromptSetVisible(prompt, true)
    PromptRegisterEnd(prompt)
  end
end
function StartFreecamThread()
  -- Camera/Pos updating thread
  Citizen.CreateThread(function ()
    local ped = PlayerPedId()
    local initialPos = GetEntityCoords(ped)
    SetFreecamPosition(initialPos[1], initialPos[2], initialPos[3])

    local function updatePos(pos, rotZ)
      if pos ~= nil and rotZ ~= nil then
        -- Update ped
        SetEntityCoords(ped, pos.x, pos.y, pos.z, false, false, false, false)
        SetEntityHeading(ped, rotZ)
        -- Update veh
        local veh = GetVehiclePedIsIn(ped, false)
        if veh and veh > 0 then
          SetEntityCoords(veh, pos.x, pos.y, pos.z, false, false, false, false)
        end
      end
    end

    local frameCounter = 0
    local loopPos, loopRotZ
    while IsFreecamActive() do
      loopPos, loopRotZ = UpdateCamera()
      frameCounter = frameCounter + 1
      if frameCounter > 100 then
        frameCounter = 0
        updatePos(loopPos, loopRotZ)
      end
      Wait(0)
    end

    -- One last time due to the optimization
    updatePos(loopPos, loopRotZ)
  end)

  if IS_FIVEM then
    local function InstructionalButton(controlButton, text)
      ScaleformMovieMethodAddParamPlayerNameString(controlButton)
      BeginTextCommandScaleformString("STRING")
      AddTextComponentSubstringKeyboardDisplay(text)
      EndTextCommandScaleformString()
    end

    --Scaleform drawing thread
    Citizen.CreateThread(function()

      local scaleform = RequestScaleformMovie("instructional_buttons")
      while not HasScaleformMovieLoaded(scaleform) do
        Wait(1)
      end
      BeginScaleformMovieMethod(scaleform, "CLEAR_ALL")
      EndScaleformMovieMethod()

      BeginScaleformMovieMethod(scaleform, "SET_CLEAR_SPACE")
      ScaleformMovieMethodAddParamInt(200)
      EndScaleformMovieMethod()

      BeginScaleformMovieMethod(scaleform, "SET_DATA_SLOT")
      ScaleformMovieMethodAddParamInt(0)
      InstructionalButton(GetControlInstructionalButton(0, CONTROLS.MOVE_FAST, true), "Faster")
      EndScaleformMovieMethod()

      BeginScaleformMovieMethod(scaleform, "SET_DATA_SLOT")
      ScaleformMovieMethodAddParamInt(1)
      InstructionalButton(GetControlInstructionalButton(0, CONTROLS.MOVE_SLOW, true), "Slower")
      EndScaleformMovieMethod()

      BeginScaleformMovieMethod(scaleform, "SET_DATA_SLOT")
      ScaleformMovieMethodAddParamInt(2)
      InstructionalButton(GetControlInstructionalButton(0, CONTROLS.MOVE_Y, true), "Fwd/Back")
      EndScaleformMovieMethod()

      BeginScaleformMovieMethod(scaleform, "SET_DATA_SLOT")
      ScaleformMovieMethodAddParamInt(3)
      InstructionalButton(GetControlInstructionalButton(0, CONTROLS.MOVE_X, true), "Left/Right")
      EndScaleformMovieMethod()

      BeginScaleformMovieMethod(scaleform, "SET_DATA_SLOT")
      ScaleformMovieMethodAddParamInt(4)
      InstructionalButton(GetControlInstructionalButton(0, CONTROLS.MOVE_Z[2], true), "Down")
      EndScaleformMovieMethod()

      BeginScaleformMovieMethod(scaleform, "SET_DATA_SLOT")
      ScaleformMovieMethodAddParamInt(5)
      InstructionalButton(GetControlInstructionalButton(0, CONTROLS.MOVE_Z[1], true), "Up")
      EndScaleformMovieMethod()

      BeginScaleformMovieMethod(scaleform, "DRAW_INSTRUCTIONAL_BUTTONS")
      EndScaleformMovieMethod()

      BeginScaleformMovieMethod(scaleform, "SET_BACKGROUND_COLOUR")
      ScaleformMovieMethodAddParamInt(0)
      ScaleformMovieMethodAddParamInt(0)
      ScaleformMovieMethodAddParamInt(0)
      ScaleformMovieMethodAddParamInt(80)
      EndScaleformMovieMethod()

      while IsFreecamActive() do
        DrawScaleformMovieFullscreen(scaleform, 255, 255, 255, 255, 0)
        Wait(0)
      end
      SetScaleformMovieAsNoLongerNeeded(scaleform)
    end)
  else
    while IsFreecamActive() do
      PromptSetActiveGroupThisFrame(promptGroupId, CreateVarString(10, 'LITERAL_STRING', 'Controls'), 1, 0, 0, 0)
      Wait(0)
    end
  end
end

--------------------------------------------------------------------------------

-- When the resource is stopped, make sure to return the camera to the player.
AddEventHandler('onResourceStop', function (resourceName)
  if resourceName == GetCurrentResourceName() then
    SetFreecamActive(false)
  end
end)
