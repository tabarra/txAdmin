//NOTE: exploratory code, not used in the final codebase
import * as monaco from 'monaco-editor';

export const register = (monacoInstance: typeof monaco) => {
    monacoInstance.languages.registerHoverProvider('fivem-config', {
        provideHover: function (model, position) {
            const line = model.getLineContent(position.lineNumber);
            if (line.length === 0) return null;
            const word = model.getWordAtPosition(position);
            if (!word) return null;
            if (word.word !== 'monitor') return null;

            return {
                range: new monaco.Range(
                    position.lineNumber,
                    word.startColumn,
                    position.lineNumber,
                    word.endColumn
                ),
                contents: [
                    { value: "**monitor** _(9.9.9-dev)_ by Tabarra" },
                    {
                        value:
                            "```md\n" +
                            'The official FiveM/RedM server web/in-game management platform.' +
                            "\n```"
                    },
                    { value: "_system_resources/monitor_" }

                ],
            };
        },
    });
}
