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
function StartFreecamThread()
  -- Camera/Pos updating thread
  Citizen.CreateThread(function ()
    local ped = PlayerPedId()
    local initialPos = GetEntityCoords(ped)
    SetFreecamPosition(initialPos[1], initialPos[2], initialPos[3])

    local function updatePos(pos, rotZ)
      if pos ~= nil and rotZ ~= nil then
        -- Update ped
        SetEntityCoords(ped, pos.x, pos.y, pos.z)
        SetEntityHeading(ped, rotZ)
        -- Update veh
        local veh = GetVehiclePedIsIn(ped, false)
        if veh and veh > 0 then 
          SetEntityCoords(veh, pos.x, pos.y, pos.z)
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
  
  local function InstructionalButton(controlButton, text)
    ScaleformMovieMethodAddParamPlayerNameString(controlButton)
    BeginTextCommandScaleformString("STRING")
    AddTextComponentScaleform(text)
    EndTextCommandScaleformString()
  end
  
  --Scaleform drawing thread
  Citizen.CreateThread(function()
    local scaleform = RequestScaleformMovie("instructional_buttons")
    while not HasScaleformMovieLoaded(scaleform) do
      Wait(1)
    end
    PushScaleformMovieFunction(scaleform, "CLEAR_ALL")
    PopScaleformMovieFunctionVoid()
    
    PushScaleformMovieFunction(scaleform, "SET_CLEAR_SPACE")
    PushScaleformMovieFunctionParameterInt(200)
    PopScaleformMovieFunctionVoid()
  
    PushScaleformMovieFunction(scaleform, "SET_DATA_SLOT")
    PushScaleformMovieFunctionParameterInt(0)
    InstructionalButton(GetControlInstructionalButton(0, CONTROLS.MOVE_FAST, 1), "Faster")
    PopScaleformMovieFunctionVoid()
      
    PushScaleformMovieFunction(scaleform, "SET_DATA_SLOT")
    PushScaleformMovieFunctionParameterInt(1)
    InstructionalButton(GetControlInstructionalButton(0, CONTROLS.MOVE_SLOW, 1), "Slower")
    PopScaleformMovieFunctionVoid()
      
    PushScaleformMovieFunction(scaleform, "SET_DATA_SLOT")
    PushScaleformMovieFunctionParameterInt(2)
    InstructionalButton(GetControlInstructionalButton(0, CONTROLS.MOVE_Y, 1), "Fwd/Back")
    PopScaleformMovieFunctionVoid()
      
    PushScaleformMovieFunction(scaleform, "SET_DATA_SLOT")
    PushScaleformMovieFunctionParameterInt(3)
    InstructionalButton(GetControlInstructionalButton(0, CONTROLS.MOVE_X, 1), "Left/Right")
    PopScaleformMovieFunctionVoid()
  
    PushScaleformMovieFunction(scaleform, "SET_DATA_SLOT")
    PushScaleformMovieFunctionParameterInt(4)
    InstructionalButton(GetControlInstructionalButton(0, CONTROLS.MOVE_Z[2], 1), "Down")
    PopScaleformMovieFunctionVoid()
  
    PushScaleformMovieFunction(scaleform, "SET_DATA_SLOT")
    PushScaleformMovieFunctionParameterInt(5)
    InstructionalButton(GetControlInstructionalButton(0, CONTROLS.MOVE_Z[1], 1), "Up")
    PopScaleformMovieFunctionVoid()
  
    PushScaleformMovieFunction(scaleform, "DRAW_INSTRUCTIONAL_BUTTONS")
    PopScaleformMovieFunctionVoid()
  
    PushScaleformMovieFunction(scaleform, "SET_BACKGROUND_COLOUR")
    PushScaleformMovieFunctionParameterInt(0)
    PushScaleformMovieFunctionParameterInt(0)
    PushScaleformMovieFunctionParameterInt(0)
    PushScaleformMovieFunctionParameterInt(80)
    PopScaleformMovieFunctionVoid()
  
    while IsFreecamActive() do
      DrawScaleformMovieFullscreen(scaleform, 255, 255, 255, 255, 0)
      Wait(0)
    end
    SetScaleformMovieAsNoLongerNeeded()
  end)
end

--------------------------------------------------------------------------------

-- When the resource is stopped, make sure to return the camera to the player.
AddEventHandler('onResourceStop', function (resourceName)
  if resourceName == GetCurrentResourceName() then
    SetFreecamActive(false)
  end
end)
