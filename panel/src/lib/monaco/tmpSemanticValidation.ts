//NOTE: exploratory code, not used in the final codebase
import * as monaco from 'monaco-editor';
import { parseConfigLine } from './tmpConfigParser';

export const register = (monacoInstance: typeof monaco) => {
    const markerOwner = 'fivem-cfg-validator';

    // Create separate validator function
    const validateFivemConfig = (model: monaco.editor.ITextModel) => {
        const markers: monaco.editor.IMarkerData[] = [];
        const lines = model.getLinesContent();

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

                //check for setting onesync variable
                if (command.string === 'set' && args[0]?.string === 'onesync') {
                    // Create error marker for 'set onesync'
                    const lastToken = args[args.length - 1];
                    markers.push({
                        severity: monacoInstance.MarkerSeverity.Error,
                        message: "You cannot set onesync in this file, it MUST only be set in the txAdmin settings page.",
                        startLineNumber: i + 1, // Monaco lines are 1-based
                        startColumn: command.start + 1, // Monaco columns are 1-based
                        endLineNumber: i + 1,
                        endColumn: lastToken.end + 1, // Include the full command
                    });
                }

                //Check for invalid locale
                if (command.string === 'sets' && args.length >= 2) {
                    const [varName, varValue] = args;
                    if (varName.string === 'locale' && varValue.string === 'root-AQ') {
                        markers.push({
                            severity: monacoInstance.MarkerSeverity.Warning,
                            message: "The root-AQ locale is used just as an example, you should replace it with your own locale.",
                            startLineNumber: i + 1,
                            startColumn: command.start + 1,
                            endLineNumber: i + 1,
                            endColumn: varValue.end + 1,
                        });
                    }
                }

                //Check for ensuring an invalid resource
                if (command.string === 'ensure' && args[0]?.string === 'whatever') {
                    // Create error marker for 'set onesync'
                    const res = args[0];
                    markers.push({
                        severity: monacoInstance.MarkerSeverity.Error,
                        message: "The resource `whatever` could not be found.\nPlease ensure you have the correct resource name.",
                        startLineNumber: i + 1, // Monaco lines are 1-based
                        startColumn: res.start + 1, // Monaco columns are 1-based
                        endLineNumber: i + 1,
                        endColumn: res.end + 1, // Include the full command
                    });
                }

                //Check for ensuring an invalid resource
                if (command.string === 'exec' && args[0]?.string.includes('@')) {
                    // Create error marker for 'set onesync'
                    markers.push({
                        severity: monacoInstance.MarkerSeverity.Info,
                        message: "At this moment txAdmin cannot validate `cfg` files referenced by the resource name (eg. `@resource/perms.cfg`).\nPlease ensure the file exists and is correctly formatted.",
                        startLineNumber: i + 1, // Monaco lines are 1-based
                        startColumn: command.start + 1, // Monaco columns are 1-based
                        endLineNumber: i + 1,
                        endColumn: args[0].end + 1, // Include the full command
                    });
                }
            }
        }

        // Sort markers by line number and column to ensure document order
        markers.sort((a, b) => {
            if (a.startLineNumber !== b.startLineNumber) {
                return a.startLineNumber - b.startLineNumber;
            }
            return a.startColumn - b.startColumn;
        });

        // Update markers on the model
        monacoInstance.editor.setModelMarkers(model, markerOwner, markers);
    };

    // Register the validator to run when the model changes
    //FIXME: not sure if this is needed, probably not. What is a model anyways?
    monacoInstance.editor.onDidCreateModel((model) => {
        if (model.getLanguageId() === 'fivem-cfg') {
            // Initial validation
            validateFivemConfig(model);

            // Set up validation to run on content changes
            model.onDidChangeContent(() => {
                validateFivemConfig(model);
            });
        }
    });
}
