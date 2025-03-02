import { cn } from "@/lib/utils";
import type { Terminal } from "@xterm/xterm";
import { sanitizeTermLine } from "./liveConsoleUtils";
import { txToast } from "@/components/TxToaster";


//Yoinked from the internet, no good source
const rtlRangeRegex = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]{3,}/; //ignoring anything less than 3 characters

//For the replacers
const ANSI_ITALIC = '\x1B[3m';

//Types
type TerminalMarkerData = {
    classes: string,
    labelShort: string,
    labelLong: string,
    onClick: (e: MouseEvent) => void,
}

type TerminalMarkerGetterResult = {
    newLine?: string,
    markerData: TerminalMarkerData,
} | undefined;


/**
 * Checks if a terminal line contains RTL characters
 */
export const getTermLineRtlData = (line: string): TerminalMarkerGetterResult => {
    if (!rtlRangeRegex.test(line)) return;
    return {
        markerData: {
            classes: 'bg-warning text-warning-foreground',
            labelShort: 'RTL',
            labelLong: 'VIEW RIGHT-TO-LEFT TEXT',
            onClick: () => {
                txToast.warning({
                    title: 'Bidirectional Text Detected:',
                    md: true,
                    msg: `Due to limitations, the terminal cannot display RTL text.\nThis is what the text is supposed to look like:\n\n${sanitizeTermLine(line)}`,
                }, { duration: 7500 });
            },
        },
    }
}


/**
 * Parses a command argument from a terminal line - kinda according to how fxserver does
 */
const parseCommandArg = (arg: string) => {
    return JSON.parse(arg.replace(/\u037e/g, ';').replace(/\\"/g, '"'));
}


/**
 * Checks if a terminal line is a txAdmin event line
 */
export const getTermLineEventData = (line: string): TerminalMarkerGetterResult => {
    const clean = sanitizeTermLine(line);
    const regex = /^(?<bar>.)\s+TXADMIN\1 txaEvent "(?<arg0>\w+)" "(?<arg1>.*)"$/;
    const match = clean.match(regex);
    if (!match || !match.groups) return;
    const { arg0, arg1 } = match.groups;


    const data = parseCommandArg(arg1);
    const lineMatcher = `txaEvent "${arg0}" "${arg1}"`;
    const newLinePart = `${ANSI_ITALIC}<broadcasting txAdmin:events:${arg0}>`;
    return {
        newLine: line.replace(lineMatcher, newLinePart),
        markerData: {
            classes: 'bg-info text-info-foreground',
            labelShort: 'EVENT',
            labelLong: 'VIEW EVENT',
            onClick: () => {
                txToast.info({
                    title: `txAdmin:events:${arg0}:`,
                    md: true,
                    msg: '```json\n' + JSON.stringify(data, null, 2) + '\n```',
                }, { duration: 7500 });
            },
        },
    }
}


/**
 * Checks if a terminal line is a txAdmin event line
 */
export const getTermLineInitialData = (line: string): TerminalMarkerGetterResult => {
    const clean = sanitizeTermLine(line);
    const regex = /^(?<bar>.)\s+TXADMIN\1 txaInitialData "(?<arg0>.*)"$/;
    const match = clean.match(regex);
    if (!match || !match.groups) return;
    console.log('getTermLineInitialData', match.groups);
    const { arg0 } = match.groups;

    const data = parseCommandArg(arg0);
    const lineMatcher = `txaInitialData "${arg0}"`;
    const newLinePart = `${ANSI_ITALIC}<txaInitialData>`;
    return {
        newLine: line.replace(lineMatcher, newLinePart),
        markerData: {
            classes: 'bg-info text-info-foreground',
            labelShort: 'CMD',
            labelLong: 'VIEW COMMAND',
            onClick: () => {
                txToast.info({
                    title: `Initial Player Data:`,
                    md: true,
                    msg: '```json\n' + JSON.stringify(data, null, 2) + '\n```',
                }, { duration: 7500 });
            },
        },
    }
}


/**
 * Registers a line marker & decoration
 */
export const registerTermLineMarker = (
    term: Terminal,
    markerData: TerminalMarkerData,
) => {
    //NOTE: as this is only called from a write callback, we will _always_ be one line ahead 
    const marker = term.registerMarker(-1);
    const decoration = term.registerDecoration({ layer: 'top', marker });
    decoration && decoration.onRender((element) => {
        if (element.innerHTML) return; //terminal re-rendering
        //old simple method
        // element.style.height = '';
        // element.style.width = '';
        // element.style.right = '0px';
        // const elClasses = cn('max-w-min px-1 py-0 text-2xs cursor-pointer rounded', classes);
        // element.innerHTML = `<div class="${elClasses}">${label}</div>`;
        // element.onclick = onClick;
        // console.log(element);

        const bgNormal = 'rgba(255,255,255, 0.01)';
        const bgHover = 'rgba(255,255,255, 0.05)';

        const btn = document.createElement('button');
        btn.className = cn('absolute right-0 px-1 py-0 text-2xs rounded overflow-hidden text-nowrap transition-all', markerData.classes);
        btn.innerText = markerData.labelShort;
        btn.onclick = markerData.onClick;

        //Button hover effect
        const updateWidth = () => {
            btn.style.width = `calc(${btn.innerText.length + 1}ch + 0.5rem)`; //0.5rem is the padding
        }
        btn.onmouseenter = () => {
            btn.innerText = markerData.labelLong;
            updateWidth();
            element.style.backgroundColor = bgHover;
        }
        btn.onmouseleave = () => {
            btn.innerText = markerData.labelShort;
            updateWidth();
            element.style.backgroundColor = bgNormal;
        }

        //Adding to the DOM
        updateWidth();
        element.classList.add('rounded');
        element.style.backgroundColor = bgNormal;
        element.style.width = '100%';
        element.replaceChildren(btn);
    });
    // marker.onDispose(() => {});
    // decoration && decoration.onDispose(() => {});
    return !!decoration;
}
