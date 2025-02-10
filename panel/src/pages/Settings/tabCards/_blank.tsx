/**
 * This template is used to serve as a starting point for creating new settings cards or copying components.
 */
import { useState, useEffect } from "react";
import { processConfigStates, SettingsCardProps, useConfAccessor } from "../utils";
import SettingsCardShell from "../SettingsCardShell";
import { AdvancedDivider } from "../settingsItems";


/**
 * Settings card blank - copy this to create a new card
 */
export default function SettingsCardBlank({ cardCtx, pageCtx }: SettingsCardProps) {
    const [showAdvanced, setShowAdvanced] = useState(false);

    //Config accessors
    const conf = useConfAccessor(pageCtx.apiData);


    //Check against stored value and sets the page state
    const processChanges = () => {
        if (!pageCtx.apiData) {
            return {
                changedConfigs: {},
                hasChanges: false,
                localConfigs: {},
            }
        }

        const diff = processConfigStates([
            //FIXME: add config accessors here
        ]);
        pageCtx.setCardPendingSave(diff ? cardCtx : null);
        return diff;
    }

    //Validate changes (for UX only) and trigger the save API
    const handleOnSave = () => {
        const { changedConfigs, hasChanges, localConfigs } = processChanges();
        if (!hasChanges) return;

        //FIXME: do validation
        pageCtx.saveChanges(cardCtx, localConfigs);
    }

    //Triggers handleChanges for state changes
    useEffect(() => {
        processChanges();
    }, [
        showAdvanced, //for referenced inputs
        //FIXME: every config that uses the state needs to be listed here
    ]);

    //Resets advanced settings when toggling the advanced switch
    useEffect(() => {
        if (showAdvanced) return;
        //FIXME: every advanced config that uses the state needs to be reset here
    }, [showAdvanced]);

    return (
        <SettingsCardShell
            cardCtx={cardCtx}
            pageCtx={pageCtx}
            onClickSave={handleOnSave}
            advanced={{
                showing: showAdvanced,
                toggle: setShowAdvanced
            }}
        >
            <h1>FIXME: add components</h1>

            {showAdvanced && <AdvancedDivider />}

            <h1>FIXME: add components</h1>
        </SettingsCardShell>
    )
}
