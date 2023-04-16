-- Prevent running if menu is disabled
if not TX_MENU_ENABLED then return end

-- =============================================
--  Logic to create scaleform/prompt instructions
-- =============================================

-- Variables
local redmGroupCounter = 0;

--- Generates a prompt group for instructional buttons
---@param keysTable table
---@return table {groupId, prompts}
function makeRedmInstructionalGroup(keysTable)
    redmGroupCounter = redmGroupCounter + 1
    local groupId = 40120 + redmGroupCounter
    local prompts = {}

    --NOTE: ordering doesn't seem to work in prompts
    for _, keyData in pairs(keysTable) do
        local prompt = PromptRegisterBegin()
        PromptSetText(prompt, CreateVarString(10, 'LITERAL_STRING', keyData[1]))
        PromptSetControlAction(prompt, keyData[2])
        PromptSetGroup(prompt, groupId, 0)
        PromptSetEnabled(prompt, true)
        PromptSetStandardMode(prompt, false)
        PromptRegisterEnd(prompt)
        prompts[keyData[1]] = prompt
    end

    return {
        groupId = groupId,
        prompts = prompts,
    }
end

--- Generates a instructional scaleform
---@param keysTable table
---@return integer scaleform
function makeFivemInstructionalScaleform(keysTable)
    local scaleform = RequestScaleformMovie("instructional_buttons")
    while not HasScaleformMovieLoaded(scaleform) do
        Wait(10)
    end
    BeginScaleformMovieMethod(scaleform, "CLEAR_ALL")
    EndScaleformMovieMethod()

    BeginScaleformMovieMethod(scaleform, "SET_CLEAR_SPACE")
    ScaleformMovieMethodAddParamInt(200)
    EndScaleformMovieMethod()

    for btnIndex, keyData in ipairs(keysTable) do
        local btn = GetControlInstructionalButton(0, keyData[2], true)

        BeginScaleformMovieMethod(scaleform, "SET_DATA_SLOT")
        ScaleformMovieMethodAddParamInt(btnIndex - 1)
        ScaleformMovieMethodAddParamPlayerNameString(btn)
        BeginTextCommandScaleformString("STRING")
        AddTextComponentSubstringKeyboardDisplay(keyData[1])
        EndTextCommandScaleformString()
        EndScaleformMovieMethod()
    end

    BeginScaleformMovieMethod(scaleform, "DRAW_INSTRUCTIONAL_BUTTONS")
    EndScaleformMovieMethod()

    BeginScaleformMovieMethod(scaleform, "SET_BACKGROUND_COLOUR")
    ScaleformMovieMethodAddParamInt(0)
    ScaleformMovieMethodAddParamInt(0)
    ScaleformMovieMethodAddParamInt(0)
    ScaleformMovieMethodAddParamInt(80)
    EndScaleformMovieMethod()

    return scaleform
end

-- NOTE: previously for spectate we used to use keymappings where we
-- would then map a key to a command (ex `txAdmin:menu:specNextPlayer`)
-- and when calling `ScaleformMovieMethodAddParamPlayerNameString()` we would
-- generate the JOAAT hash of the command name and pass to the function above
-- in this format: `~INPUT_698AE6AF~`.
-- Stopped using keymappings on spectate due to lack of support in RedM

-- NOTE: online JOAAT will not work, need to use the implementation
-- found in fivem/ext/sdk/resources/sdk-root/shell/src/utils/joaat.ts
