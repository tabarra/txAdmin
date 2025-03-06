//NOTE: exploratory code, not used in the final codebase
import * as monaco from 'monaco-editor';
import { parseConfigLine } from './tmpConfigParser';

export const register = (monacoInstance: typeof monaco) => {
    const tokenTypes = [
        "keyword.command.setter",
        "keyword",
        "convar",
        "variable",
        "string",
        "string.escape",
        "comment",
        "delimiter",
        "number",
        "resource.group",
        "resource.name",
        "keyword.command.exec",
    ];

    function getType(type: string) {
        return tokenTypes.indexOf(type);
    }
    const tokenPattern = new RegExp("([a-zA-Z]+)((?:\\.[a-zA-Z]+)*)", "g");

    // Register semantic tokens provider (now without validation logic)
    monacoInstance.languages.registerDocumentSemanticTokensProvider("fivem-cfg", {
        getLegend: function () {
            return {
                tokenTypes,
                tokenModifiers: ["declaration", "definition", "readonly"],
            };
        },
        provideDocumentSemanticTokens: function (model, lastResultId, token) {
            const lines = model.getLinesContent();
            const data: number[] = [];

            let lastLine = 0;
            const addColor = (line: number, start: number, length: number, type: string, mod = 0) => {
                data.push(line - lastLine, start, length, getType(type), mod);
                lastLine = line;
            };

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                //Ignore empty & comment lines
                if (!line.trim()) continue;
                if (/^\s*(#|\/\/)/.test(line)) continue;

                //Get command
                const statements = parseConfigLine(line);
                for (const statement of statements) {
                    if (!statement.length) continue;

                    const [command, ...args] = statement;
                    if (command.string === 'exec') {
                        addColor(i, command.start, command.string.length, 'keyword.command.exec');
                    }

                    if(command.string === 'set' && args[0]?.string === 'onesync') {
                        addColor(i, command.start, command.string.length, 'keyword.command.setter');
                    }
                }
            }

            return { data: new Uint32Array(data) };
        },
        releaseDocumentSemanticTokens: function (resultId) { },
    });
}
