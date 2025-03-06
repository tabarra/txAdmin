import { throttle } from "throttle-debounce";

export type GlobalHotkeyAction = 'focusPlayerlistFilter' | 'toggleLightMode';

const keyDebounceTime = 150; //ms
const sendHotkeyEvent = throttle(keyDebounceTime, (action: GlobalHotkeyAction) => {
    console.log('sending hotkey event', action);
    window.postMessage({
        type: 'globalHotkey',
        action,
    });
}, { noTrailing: true });


/**
 * Handles events and returns true if the event was handled.
 */
export function handleHotkeyEvent(e: KeyboardEvent) {
    if (e.code === 'KeyK' && e.ctrlKey) {
        sendHotkeyEvent('focusPlayerlistFilter');
        return true;
    } else if (e.code === 'KeyL' && e.altKey) {
        sendHotkeyEvent('toggleLightMode');
        return true;
    }
    return false;
}


/**
 * Event listener for hotkeys with preventDefault.
 */
export function hotkeyEventListener(e: KeyboardEvent) {
    if (handleHotkeyEvent(e)) {
        e.preventDefault();
    }
}
