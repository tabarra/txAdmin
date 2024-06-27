import type { ITerminalInitOnlyOptions, ITerminalOptions, ITheme } from "@xterm/xterm";

//From legacy systemLog.ejs, based on the ANSI-UP colors
//TODO: at component instantiation, grab those as variables from the CSS
// putting css variables here will not work (i think)
const baseTheme: ITheme = {
    background: '#222326', //card bg
    foreground: '#F8F8F8',
    black: '#000000',
    brightBlack: '#555555',
    red: '#D62341',
    brightRed: '#FF5370',
    green: '#9ECE58',
    brightGreen: '#C3E88D',
    yellow: '#FAED70',
    brightYellow: '#FFCB6B',
    blue: '#396FE2',
    brightBlue: '#82AAFF',
    magenta: '#BB80B3',
    brightMagenta: '#C792EA',
    cyan: '#2DDAFD',
    brightCyan: '#89DDFF',
    white: '#D0D0D0',
    brightWhite: '#FFFFFF',
};

const terminalOptions: ITerminalOptions | ITerminalInitOnlyOptions = {
    theme: baseTheme,
    convertEol: true,
    cursorBlink: true,
    cursorStyle: 'bar',
    disableStdin: true,
    drawBoldTextInBrightColors: false,
    fontFamily: "JetBrains Mono Variable, monospace",
    fontSize: 14,
    lineHeight: 1.1,
    fontWeight: "300",
    fontWeightBold: "600",
    letterSpacing: 0.8,
    scrollback: 5000,
    // scrollback: 2500, //more or less equivalent to the legacy 250kb limit
    allowProposedApi: true,
    allowTransparency: true,
    overviewRulerWidth: 15,
};

/*
    NOTE: When implementing a stored options dropdown, add the following options:
    - fontSize
    - lineHeight
    - scrollback
    - RTL fixes
    - light mode?
    - whether clicking on a saved command copies it to the input or executes it directly
*/
export default terminalOptions;
