import { throttle } from "throttle-debounce";
import * as monaco from 'monaco-editor';
import type { editor } from 'monaco-editor'; //peer dependency


//FIXME: this doesn't require exporting, but HMR doesn't work without it
// eslint-disable-next-line @typescript-eslint/no-explicit-any, react-refresh/only-export-components
export const throttleFunc = throttle(350, (func: any) => {
    func();
}, { noLeading: true });


/**
 * Register a resize watcher for responsive line numbers and minimap
 */
export const registerResizeWatcher = (editor: editor.IStandaloneCodeEditor) => {
    // Handle responsive line numbers
    const updateSizedOptions = () => {
        const isTwSm = window.matchMedia('(min-width: 640px)').matches;
        editor.updateOptions({ lineNumbers: isTwSm ? 'on' : 'off' });
        const isTwLg = window.matchMedia('(min-width: 1024px)').matches;
        editor.updateOptions({ minimap: { enabled: isTwLg } });
    };
    // Initial check
    updateSizedOptions();

    const resizeListener = () => {
        throttleFunc(() => updateSizedOptions());
    };

    // Add resize listener
    window.addEventListener('resize', resizeListener);

    // Cleanup listener when component unmounts
    return () => {
        throttleFunc.cancel({ upcomingOnly: true });
        window.removeEventListener('resize', resizeListener);
    };
};


/**
 * Add keyboard shortcut for toggling comments (Ctrl+;)
 */
export const registerDefaultHotkeys = (editor: editor.IStandaloneCodeEditor) => {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Semicolon, () => {
        editor.trigger('keyboard', 'editor.action.commentLine', null);
    });
};
