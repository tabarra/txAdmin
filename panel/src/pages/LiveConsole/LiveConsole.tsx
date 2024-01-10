import { Terminal } from '@xterm/xterm';
import { CanvasAddon } from '@xterm/addon-canvas';
import { FitAddon } from '@xterm/addon-fit';
import { SearchAddon } from '@xterm/addon-search';
import { useEffect, useMemo, useRef, useState } from "react";
import { useEventListener } from 'usehooks-ts';
import { useContentRefresh, useSetPageTitle } from "@/hooks/pages";
import { debounce, throttle } from 'throttle-debounce';

import { ChevronsDownIcon } from "lucide-react";
import LiveConsoleFooter from "./LiveConsoleFooter";
import LiveConsoleHeader from "./LiveConsoleHeader";
import LiveConsoleSearchBar from "./LiveConsoleSearchBar";
// import LiveConsoleSaveSheet from "./LiveConsoleSaveSheet";

import ScrollDownAddon from "./ScrollDownAddon";
import terminalOptions from "./xtermOptions";
import './xtermOverrides.css';
import '@xterm/xterm/css/xterm.css';


const keyDebounceTime = 150; //ms

export default function LiveConsole() {
    // const [isSaveSheetOpen, setIsSaveSheetOpen] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [showSearchBar, setShowSearchBar] = useState(false);
    const setPageTitle = useSetPageTitle();
    const refreshPage = useContentRefresh();
    setPageTitle('Live Console');


    /**
     * xterm stuff
     */
    const jumpBottomBtnRef = useRef<HTMLButtonElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const termElRef = useRef<HTMLDivElement>(null);
    const term = useMemo(() => new Terminal(terminalOptions), []);
    const fitAddon = useMemo(() => new FitAddon(), []);
    const searchAddon = useMemo(() => new SearchAddon(), []);

    const sendSearchKeyEvent = throttle(keyDebounceTime, (action: string) => {
        window.postMessage({
            type: 'liveConsoleSearchHotkey',
            action,
        });
    }, { noTrailing: true });

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
    useEventListener('resize', debounce(100, refitTerminal));

    useEffect(() => {
        if (containerRef.current && termElRef.current && !term.element) {
            console.log('live console xterm init');
            termElRef.current.innerHTML = ''; //due to HMR, the terminal element might still be there
            term.loadAddon(fitAddon);
            term.loadAddon(searchAddon);
            term.loadAddon(new CanvasAddon());
            term.loadAddon(new ScrollDownAddon(jumpBottomBtnRef));
            term.open(termElRef.current);
            refitTerminal();
            term.write('\x1b[?25l'); //hide cursor

            const scrollPageUp = throttle(keyDebounceTime, () => {
                term.scrollLines(Math.min(1, 2 - term.rows));
            }, { noTrailing: true });
            const scrollPageDown = throttle(keyDebounceTime, () => {
                term.scrollLines(Math.max(1, term.rows - 2));
            }, { noTrailing: true });
            const scrollTop = throttle(keyDebounceTime, () => {
                term.scrollToTop();
            }, { noTrailing: true });
            const scrollBottom = throttle(keyDebounceTime, () => {
                term.scrollToBottom();
            }, { noTrailing: true });

            term.attachCustomKeyEventHandler((e: KeyboardEvent) => {
                if (e.code === 'F5') {
                    // let live console handle it
                    return false;
                } else if (e.code === 'Escape') {
                    // let live console handle it
                    return false;
                } else if (e.code === 'KeyF' && (e.ctrlKey || e.metaKey)) {
                    // let live console handle it
                    return false;
                } else if (e.code === 'F3') {
                    // let live console handle it
                    return false;
                } else if (e.code === 'KeyC' && (e.ctrlKey || e.metaKey)) {
                    document.execCommand('copy');
                    term.clearSelection();
                    return false;
                } else if (e.code === 'PageUp') {
                    scrollPageUp();
                    return false;
                } else if (e.code === 'PageDown') {
                    scrollPageDown();
                    return false;
                } else if (e.code === 'Home') {
                    scrollTop();
                    return false;
                } else if (e.code === 'End') {
                    scrollBottom();
                    return false;
                }
                return true;
            });

            //DEBUG
            term.writeln('Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo. \u001b[1m\u001b[33m CanvasAddon');
            for (let i = 0; i < 40; i++) {
                term.writeln(Math.random().toString(36).substring(2, 15))
            }
        }
    }, [term]);

    useEventListener('keydown', (e: KeyboardEvent) => {
        console.log('live console keydown', e.code);
        if (e.code === 'F5') {
            refreshPage();
            e.preventDefault();
        } else if (e.code === 'Escape') {
            searchAddon.clearDecorations();
            setShowSearchBar(false);
        } else if (e.code === 'KeyF' && (e.ctrlKey || e.metaKey)) {
            if (showSearchBar) {
                sendSearchKeyEvent('focus');
            } else {
                setShowSearchBar(true);
            }
            e.preventDefault();
        } else if (e.code === 'F3') {
            sendSearchKeyEvent(e.shiftKey ? 'previous' : 'next');
            e.preventDefault();
        }
    });

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
        }, 100);
        return () => clearInterval(interval);
    }, []);


    /**
     * Action Handlers
     */
    const consoleWrite = (data: string) => {
        //FIXME:
        term.writeln(data);
    }
    const consoleClear = () => {
        term.clear();
    }
    const toggleSearchBar = () => {
        setShowSearchBar(!showSearchBar);
    }
    const toggleSaveSheet = () => {
        // setIsSaveSheetOpen(!isSaveSheetOpen);
    }


    return (
        <div className="dark text-primary flex flex-col h-full w-full bg-card border md:rounded-xl overflow-clip">
            <LiveConsoleHeader />

            <div className="flex flex-col relative grow bg-card">
                {/* <LiveConsoleSaveSheet isOpen={isSaveSheetOpen} closeSheet={() => setIsSaveSheetOpen(false)} /> */}

                <div ref={containerRef} className='w-full h-full relative overflow-hidden'>
                    <div ref={termElRef} className='absolute inset-x-2x left-1 right-0 top-1' />
                </div>

                <LiveConsoleSearchBar
                    show={showSearchBar}
                    setShow={setShowSearchBar}
                    searchAddon={searchAddon}
                />

                <button
                    ref={jumpBottomBtnRef}
                    className='absolute bottom-0 right-2 z-50 hidden opacity-75'
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
