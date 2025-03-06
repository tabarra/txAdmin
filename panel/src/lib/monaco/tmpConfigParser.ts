//NOTE: exploratory code, not used in the final codebase

/**
 * This is an improved version of the one in core/lib/fxserver/fxsConfigHelper.ts
 */
export const parseConfigLine = (input: string) => {
    let inEscape = false;
    type Token = { start: number, end: number, string: string, inQuote: boolean };
    type Command = Token[]; 
    const statements: Command[] = [];
    const getBlankToken = (start: number): Token => ({ start, end: start, string: '', inQuote: false });

    let currCommand: Command = [];
    let currToken = getBlankToken(0);
    for (let i = 0; i < input.length; i++) {
        const currChar = input[i];
        if (inEscape) {
            if (currChar === '"' || currChar === '\\') {
                currToken.string += currChar;
            }
            inEscape = false;
            continue;
        }

        if (!currToken.string) {
            if (
                input.slice(i, i + 2) === '//'
                || currChar === '#'
            ) {
                break;
            }
        }

        if (!currToken.inQuote && input.charCodeAt(i) <= 32) {
            //Close token
            if (currToken.string.length) {
                currToken.end = i;
                currCommand.push(currToken);
                currToken = getBlankToken(i + 1);
            }
            continue;
        }

        if (currChar === '"') {
            if (currToken.inQuote) {
                currToken.end = i;
                currCommand.push(currToken);
                currToken = getBlankToken(i + 1);
            } else {
                currToken.inQuote = true;
            }
            continue;
        }

        if (currChar === '\\') {
            inEscape = true;
            continue;
        }

        if (!currToken.inQuote && currChar === ';') {
            if (currToken.string.length) {
                currToken.end = i;
                currCommand.push(currToken);
                currToken = getBlankToken(i + 1);
            }
            if (currCommand.length) {
                statements.push(currCommand);
                currCommand = [];
            }
            continue;
        };

        currToken.string += currChar;
    }
    if (currToken.string.length) {
        currToken.end = input.length;
        currCommand.push(currToken);
    }
    statements.push(currCommand);

    return statements;
};
