import React, { useEffect, useRef, useState } from 'react';
import { useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { Input } from "@/components/ui/input";
import { cn, openExternalLink } from "@/lib/utils";
import { BookMarkedIcon, FileDownIcon, SearchIcon, Trash2Icon } from "lucide-react";


type ConsoleFooterButtonProps = {
    icon: React.ElementType;
    title: string;
    disabled?: boolean;
    onClick: () => void;
}

function ConsoleFooterButton({ icon: Icon, title, disabled, onClick }: ConsoleFooterButtonProps) {
    return (
        <div
            className={cn(
                "group bg-secondary xs:bg-transparent 2xl:hover:bg-secondary w-full rounded-lg px-1.5 py-2 cursor-pointer flex items-center justify-center",
                disabled && 'opacity-50 pointer-events-none'
            )}
            onClick={() => !disabled && onClick()}
        >
            <Icon className="w-6 h-6 2xl:w-5 2xl:h-5 text-muted-foreground group-hover:scale-110 group-hover:text-secondary-foreground inline" />
            <span className="hidden 2xl:inline ml-1 align-middle">
                {title}
            </span>
        </div>
    )
}


// Create the history atom outside of the component
// TODO: move this to hooks?
export const historyAtom = atomWithStorage<string[]>('liveConsoleCommandHistory', []);
const historyMaxLength = 100;

type LiveConsoleFooterProps = {
    isConnected: boolean;
    consoleWrite: (data: string) => void;
    consoleClear: () => void;
    toggleSaveSheet: () => void;
    toggleSearchBar: () => void;
}

export default function LiveConsoleFooter(props: LiveConsoleFooterProps) {
    const [history, setHistory] = useAtom(historyAtom);
    const [histIndex, setHistIndex] = useState(-1);
    const savedInput = useRef('');
    const termInputRef = useRef<HTMLInputElement>(null);

    //autofocus on input when connected
    useEffect(() => {
        if (props.isConnected && termInputRef.current) {
            termInputRef.current.focus();
        }
    }, [props.isConnected]);

    const handleArrowUp = () => {
        if (!termInputRef.current) return;
        if (histIndex === -1) {
            savedInput.current = termInputRef.current.value ?? '';
        }
        const nextHistId = histIndex + 1;
        if (history[nextHistId]) {
            termInputRef.current.value = history[nextHistId];
            setHistIndex(nextHistId);
        }
    };

    const handleArrowDown = () => {
        if (!termInputRef.current) return;
        const prevHistId = histIndex - 1;
        if (prevHistId === -1) {
            termInputRef.current.value = savedInput.current;
            setHistIndex(prevHistId);
        } else if (history[prevHistId]) {
            termInputRef.current.value = history[prevHistId];
            setHistIndex(prevHistId);
        }
    };

    const handleEnter = () => {
        if (!termInputRef.current) return;
        const currentInput = termInputRef.current.value.trim();
        setHistIndex(-1);
        termInputRef.current.value = '';
        savedInput.current = '';

        if (currentInput) {
            const newHistory = history.filter((cmd) => cmd !== currentInput);
            newHistory.unshift(currentInput);
            if (newHistory.length > historyMaxLength) newHistory.pop();
            setHistory(newHistory);
            props.consoleWrite(currentInput);
        }
    };

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!props.isConnected) return;
        if (e.key === 'ArrowUp') {
            handleArrowUp();
            e.preventDefault();
        } else if (e.key === 'ArrowDown') {
            handleArrowDown();
            e.preventDefault();
        } else if (e.key === 'Enter') {
            handleEnter();
            e.preventDefault();
        }
    }

    return (
        <div className="flex flex-col xs:flex-row xs:items-center gap-2 px-1 sm:px-4 py-2 border-t justify-center">
            <div className="flex items-center grow">
                <svg
                    className="hidden sm:block w-4 h-4 mr-2 text-warning-inline shrink-0"
                    fill="none"
                    height="24"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="24"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path d="m9 18 6-6-6-6" />
                </svg>
                <Input
                    ref={termInputRef}
                    className="w-full"
                    placeholder="Type a command..."
                    type="text"
                    disabled={!props.isConnected}
                    onKeyDown={handleInputKeyDown}
                    autoCapitalize='none'
                />
            </div>
            <div className="flex flex-row justify-evenly gap-3 2xl:gap-1 select-none">
                {/* <ConsoleFooterButton icon={BookMarkedIcon} title="Saved" onClick={props.toggleSaveSheet} /> */}
                <ConsoleFooterButton
                    icon={SearchIcon}
                    title="Search"
                    disabled={!props.isConnected}
                    onClick={props.toggleSearchBar}
                />
                <ConsoleFooterButton
                    icon={Trash2Icon}
                    title="Clear"
                    disabled={!props.isConnected}
                    onClick={props.consoleClear}
                />
                <ConsoleFooterButton
                    icon={FileDownIcon}
                    title="Download"
                    disabled={!props.isConnected}
                    onClick={() => {
                        openExternalLink('/fxserver/downloadLog');
                    }} />
            </div>
        </div>
    );
}
