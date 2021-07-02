local INPUT_LOOK_LR = 1
local INPUT_LOOK_UD = 2
local INPUT_CHARACTER_WHEEL = 19
local INPUT_SPRINT = 21
local INPUT_MOVE_UD = 31
local INPUT_MOVE_LR = 30
local INPUT_VEH_ACCELERATE = 71
local INPUT_VEH_BRAKE = 72
local INPUT_PARACHUTE_BRAKE_LEFT = 152
local INPUT_PARACHUTE_BRAKE_RIGHT = 153

--------------------------------------------------------------------------------

local BASE_CONTROL_MAPPING = protect({
  -- Rotation
  LOOK_X = INPUT_LOOK_LR,
  LOOK_Y = INPUT_LOOK_UD,

  -- Position
  MOVE_X = INPUT_MOVE_LR,
  MOVE_Y = INPUT_MOVE_UD,
  MOVE_Z = { INPUT_PARACHUTE_BRAKE_LEFT, INPUT_PARACHUTE_BRAKE_RIGHT },

  -- Multiplier
  MOVE_FAST = INPUT_SPRINT,
  MOVE_SLOW = INPUT_CHARACTER_WHEEL
})

--------------------------------------------------------------------------------

local BASE_CONTROL_SETTINGS = protect({
  -- Rotation
  LOOK_SENSITIVITY_X = 5,
  LOOK_SENSITIVITY_Y = 5,

  -- Position
  BASE_MOVE_MULTIPLIER = 0.85,
  FAST_MOVE_MULTIPLIER = 6,
  SLOW_MOVE_MULTIPLIER = 6,
})

--------------------------------------------------------------------------------

local BASE_CAMERA_SETTINGS = protect({
  --Camera
  FOV = 50.0,

  -- On enable/disable
  ENABLE_EASING = true,
  EASING_DURATION = 250,

  -- Keep position/rotation
  KEEP_POSITION = false,
  KEEP_ROTATION = false
})

--------------------------------------------------------------------------------

_G.KEYBOARD_CONTROL_MAPPING = table.copy(BASE_CONTROL_MAPPING)
_G.GAMEPAD_CONTROL_MAPPING = table.copy(BASE_CONTROL_MAPPING)

-- Swap up/down movement (LB for down, RB for up)
_G.GAMEPAD_CONTROL_MAPPING.MOVE_Z[1] = INPUT_PARACHUTE_BRAKE_LEFT
_G.GAMEPAD_CONTROL_MAPPING.MOVE_Z[2] = INPUT_PARACHUTE_BRAKE_RIGHT

-- Use LT and RT for speed
_G.GAMEPAD_CONTROL_MAPPING.MOVE_FAST = INPUT_VEH_ACCELERATE
_G.GAMEPAD_CONTROL_MAPPING.MOVE_SLOW = INPUT_VEH_BRAKE

protect(_G.KEYBOARD_CONTROL_MAPPING)
protect(_G.GAMEPAD_CONTROL_MAPPING)

--------------------------------------------------------------------------------

_G.KEYBOARD_CONTROL_SETTINGS = table.copy(BASE_CONTROL_SETTINGS)
_G.GAMEPAD_CONTROL_SETTINGS = table.copy(BASE_CONTROL_SETTINGS)

-- Gamepad sensitivity can be reduced by BASE.
_G.GAMEPAD_CONTROL_SETTINGS.LOOK_SENSITIVITY_X = 2
_G.GAMEPAD_CONTROL_SETTINGS.LOOK_SENSITIVITY_Y = 2

protect(_G.KEYBOARD_CONTROL_SETTINGS)
protect(_G.GAMEPAD_CONTROL_SETTINGS)

--------------------------------------------------------------------------------

_G.CAMERA_SETTINGS = table.copy(BASE_CAMERA_SETTINGS)
protect(_G.CAMERA_SETTINGS)

--------------------------------------------------------------------------------

-- Create some convenient variables.
-- Allows us to access controls and config without a gamepad switch.
_G.CONTROL_MAPPING  = CreateGamepadMetatable(_G.KEYBOARD_CONTROL_MAPPING,  _G.GAMEPAD_CONTROL_MAPPING)
_G.CONTROL_SETTINGS = CreateGamepadMetatable(_G.KEYBOARD_CONTROL_SETTINGS, _G.GAMEPAD_CONTROL_SETTINGS)
