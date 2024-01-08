import { useEffect, useMemo, useRef, useState } from "react";
// import LiveConsoleSaveSheet from "./LiveConsoleSaveSheet";
import { useSetPageTitle } from "@/hooks/pages";
import LiveConsoleFooter from "./LiveConsoleFooter";
import LiveConsoleHeader from "./LiveConsoleHeader";
import { ChevronsDownIcon } from "lucide-react";
import type { ITerminalInitOnlyOptions, ITerminalOptions, ITheme } from '@xterm/xterm';
import { Terminal } from '@xterm/xterm';
import { CanvasAddon } from '@xterm/addon-canvas';
import { FitAddon } from '@xterm/addon-fit';
import { useEventListener } from 'usehooks-ts';
import debounce from 'debounce';
import '@xterm/xterm/css/xterm.css';
import ScrollDownAddon from "./ScrollDownAddon";


//From legacy systemLog.ejs, based on the ANSI-UP colors
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
    fontSize: 13,
    fontWeight: "300",
    letterSpacing: 0.8,
    scrollback: 5000,
    // scrollback: 2500, //more or less equivalent to the legacy 250kb limit
    // allowProposedApi: true,
    // allowTransparency: true,
};


export default function LiveConsole() {
    // const [isSaveSheetOpen, setIsSaveSheetOpen] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const setPageTitle = useSetPageTitle();
    setPageTitle('Live Console');


    /**
     * xterm stuff
     */
    const jumpBottomBtnRef = useRef<HTMLButtonElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const termElRef = useRef<HTMLDivElement>(null);
    const term = useMemo(() => new Terminal(terminalOptions), []);
    const fitAddon = useMemo(() => new FitAddon(), []);

    const refitTerminal = () => {
        if (containerRef.current && term.element && fitAddon) {
            //fitAddon does not get the correct height, so we have to calculate it ourselves
            const charMeasureElement = document.querySelector('.xterm-char-measure-element');
            const charHeight = charMeasureElement?.getBoundingClientRect().height;
            const parentElementStyle = window.getComputedStyle(containerRef.current);
            const parentElementHeight = parseInt(parentElementStyle.getPropertyValue('height'));
            const elementStyle = window.getComputedStyle(term.element.parentElement!);
            const insetYSize = parseInt(elementStyle.getPropertyValue('top'));
            const availableHeight = parentElementHeight - (insetYSize);
            const newRows = Math.max(4, Math.floor(availableHeight / charHeight!));

            const proposed = fitAddon.proposeDimensions();
            term.resize(proposed!.cols, newRows);
        } else {
            console.log('refitTerminal: no containerRef.current or term.element or fitAddon');
        }
    }
    useEventListener('resize', debounce(refitTerminal, 100));

    useEffect(() => {
        if (containerRef.current && termElRef.current && !term.element) {
            console.log('live console xterm init');
            termElRef.current.innerHTML = ''; //due to HMR, the terminal element might still be there
            term.loadAddon(fitAddon);
            term.loadAddon(new CanvasAddon());
            term.loadAddon(new ScrollDownAddon(jumpBottomBtnRef));
            term.open(termElRef.current);
            refitTerminal();
            term.write('\x1b[?25l'); //hide cursor
            term.writeln('Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo. \u001b[1m\u001b[33m CanvasAddon');
            for (let i = 0; i < 40; i++) {
                term.writeln(Math.random().toString(36).substring(2, 15))
            }
        }
    }, [term]);

    //DEBUG
    useEffect(() => {
        let cnt = 0;
        const interval = setInterval(function LoLoLoLoLoLoL() {
            cnt++;
            const mod = cnt % 60;
            term.writeln(
                cnt.toString().padStart(6, '0') + ' ' +
                '\u001b[1m\u001b[31m=\u001b[0m'.repeat(mod) +
                '\u001b[1m\u001b[33m.\u001b[0m'.repeat(60 - mod)
            );
        }, 150);
        return () => clearInterval(interval);
    }, []);


    /**
     * Action Handlers
     */
    const consoleWrite = (data: string) => {
        //
    }
    const consoleClear = () => {
        term.clear();
    }
    const toggleSearchBar = () => {
        //
    }
    const toggleSaveSheet = () => {
        // setIsSaveSheetOpen(!isSaveSheetOpen);
    }


    return (
        <div className="dark text-primary flex flex-col h-full w-full bg-card border md:rounded-xl overflow-clip">
            <LiveConsoleHeader />

            <div className="flex flex-col relative grow">
                {/* <LiveConsoleSaveSheet isOpen={isSaveSheetOpen} closeSheet={() => setIsSaveSheetOpen(false)} /> */}

                <div ref={containerRef} className='w-full h-full relative overflow-hidden'>
                    <div ref={termElRef} className='absolute inset-x-2 top-1' />
                </div>

                <button
                    ref={jumpBottomBtnRef}
                    className='absolute bottom-0 right-6 z-50 hidden opacity-75'
                    onClick={() => { term.scrollToBottom() }}
                >
                    <ChevronsDownIcon className='w-20 h-20 animate-pulse hover:animate-none hover:scale-110' />
                </button>
            </div>

            <LiveConsoleFooter
                isConnected={isConnected}
                consoleWrite={consoleWrite}
                consoleClear={consoleClear}
                toggleSaveSheet={toggleSaveSheet}
                toggleSearchBar={toggleSearchBar}
            />
        </div>
    )
}
