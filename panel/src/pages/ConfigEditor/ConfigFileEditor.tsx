import { Editor } from "@monaco-editor/react";
import { useEffect } from "react";
import type { editor } from 'monaco-editor'; //peer dependency
import { useIsDarkMode } from "@/hooks/theme";
import { registerDefaultHotkeys, registerResizeWatcher } from "@/lib/monaco/editorUtils";
import * as fivemConfigLang from "@/lib/monaco/fivemConfigLanguage";

type ConfigFileEditorProps = {
    editorRef: React.MutableRefObject<editor.IStandaloneCodeEditor | null>;
    fileData?: string;
    onSaveChanges: () => void;
};

export default function ConfigFileEditor({ editorRef, fileData, onSaveChanges }: ConfigFileEditorProps) {
    const isDarkMode = useIsDarkMode();
    useEffect(() => {
        if (!editorRef.current) return;
        editorRef.current.updateOptions({ theme: isDarkMode ? fivemConfigLang.THEME.dark : fivemConfigLang.THEME.light });
    }, [isDarkMode]);

    //FIXME:NC try this for cleanup
    // useEffect(() => {
    //     if (!editorRef.current) return;
    //     const cleanup = registerResizeWatcher(editorRef.current);
    //     return () => {
    //       console.log("Component unmounted: Cleanup resize watcher");
    //       cleanup();
    //     };
    //   }, [editorRef.current]);

    return (
        <div className="w-full">
            <Editor
                defaultValue={fileData}
                loading={null}
                language={fivemConfigLang.LANG}
                theme={isDarkMode ? fivemConfigLang.THEME.dark : fivemConfigLang.THEME.light}
                beforeMount={(monaco) => {
                    fivemConfigLang.register(monaco);
                }}
                onMount={(editor, monaco) => {
                    //init
                    editorRef.current = editor;
                    registerDefaultHotkeys(editor);
                    const resizeWatcherCleanup = registerResizeWatcher(editor);

                    //Custom commands
                    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
                        onSaveChanges();
                    });

                    // Cleanup listener when component unmounts
                    return () => {
                        //FIXME:NC onMount literally expects void, not a cleanup callback - this doesn't work!
                        console.log('onMount cleanup');
                        resizeWatcherCleanup();
                    };
                }}
                options={{
                    // "semanticHighlighting.enabled": true,
                    automaticLayout: true,
                    minimap: { enabled: false }, //seems to be flickering on resize
                    lineNumbers: "on",
                    scrollBeyondLastLine: false,
                    wordWrap: "on",
                }}
            />
        </div>
    )
}
