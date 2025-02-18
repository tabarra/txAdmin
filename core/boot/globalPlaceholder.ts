import { txDevEnv } from "@core/globalData";
import consoleFactory from "@lib/console";
import fatalError from "@lib/fatalError";
const console = consoleFactory('GlobalPlaceholder');

//Messages
const MSG_VIOLATION = 'Global Proxy Access Violation!';
const MSG_BOOT_FAIL = 'Failed to boot due to Module Race Condition.';
const MSG_CONTACT_DEV = 'This error should never happen, please report it to the developers.';
const MSG_ERR_PARTIAL = 'Attempted to access txCore before it was initialized!';


/**
 * Returns a Proxy that will throw a fatalError when accessing an uninitialized property
 */
export const getCoreProxy = (refSrc: any) => {
    return new Proxy(refSrc, {
        get: function (target, prop) {
            // if (!txDevEnv.ENABLED && Reflect.has(target, prop)) {
            //     if (console.isVerbose) {
            //         console.majorMultilineError([
            //             MSG_VIOLATION,
            //             MSG_CONTACT_DEV,
            //             `Getter for ${String(prop)}`,
            //         ]);
            //     }
            //     return Reflect.get(target, prop).deref();
            // }
            fatalError.Boot(
                22,
                [
                    MSG_BOOT_FAIL,
                    MSG_CONTACT_DEV,
                    ['Getter for', String(prop)],
                ],
                new Error(MSG_ERR_PARTIAL)
            );
        },
        set: function (target, prop, value) {
            fatalError.Boot(
                23,
                [
                    MSG_BOOT_FAIL,
                    MSG_CONTACT_DEV,
                    ['Setter for', String(prop)],
                ],
                new Error(MSG_ERR_PARTIAL)
            );
            return true;
        }
    });
}
