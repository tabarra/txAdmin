import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ISearchDecorationOptions, ISearchOptions, SearchAddon } from "@xterm/addon-search";
import { ArrowDownIcon, ArrowUpIcon, CaseSensitiveIcon, RegexIcon, WholeWordIcon, XIcon } from "lucide-react";
import { ReactNode, useEffect, useRef, useState } from "react";
import { useEventListener } from "usehooks-ts";


type ButtonProps = {
    title?: string;
    onClick: () => void;
    isActive?: boolean;
    children: ReactNode;
};

function SearchBarButton({ title, onClick, isActive, children }: ButtonProps) {
    return (
        <button
            title={title}
            className={cn(
                "rounded p-0.5",
                "hover:bg-secondary-foreground hover:text-secondary",
                "focus:outline-none focus:ring-1 focus:ring-secondary-foreground focus:ring-offset-1x focus:ring-offset-secondary-foreground",
                isActive && 'bg-muted-foreground text-secondary'
            )}
            onClick={onClick}
        >
            {children}
        </button>
    );
}


const labelNoResults = 'No results';
const xtermDecorations = {
    activeMatchBackground: '#FF00DC',
    activeMatchColorOverviewRuler: '#FF00DC',
    matchBackground: '#732268',
    matchOverviewRuler: '#732268',
} satisfies ISearchDecorationOptions;

type LiveConsoleSearchBarProps = {
    show: boolean;
    setShow: (show: boolean) => void;
    searchAddon: SearchAddon;
};

export default function LiveConsoleSearchBar({ show, setShow, searchAddon }: LiveConsoleSearchBarProps) {
    const [caseSensitive, setCaseSensitive] = useState(false);
    const [wholeWord, setWholeWord] = useState(false);
    const [regex, setRegex] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const [resultCount, setResultCount] = useState(labelNoResults);

    //helpers
    const clearSearchState = (newStatus?: string) => {
        searchAddon.clearDecorations();
        if (newStatus) {
            setResultCount(newStatus);
        }
    }
    const getSearchOptions = (overrides?: Partial<ISearchOptions>): ISearchOptions => ({
        decorations: xtermDecorations,
        caseSensitive,
        wholeWord,
        regex,
        ...overrides,
    })

    //autofocus the input
    useEffect(() => {
        if (show) {
            inputRef.current?.focus();
        } else {
            clearSearchState(labelNoResults);
        }
    }, [show]);

    //listens to the result count change
    useEffect(() => {
        if (!searchAddon) return;
        const dispose = searchAddon.onDidChangeResults(({ resultIndex, resultCount }) => {
            if (resultIndex === -1) {
                setResultCount(labelNoResults);
            } else {
                setResultCount(`${resultIndex + 1}/${resultCount}`);
            }
        });
        return () => {
            dispose.dispose();
        }
    }, []);

    //Handlers
    const handlePrevious = () => {
        if (!inputRef.current || !inputRef.current.value) return;
        console.log('backward search for', inputRef.current.value);
        searchAddon.findPrevious(inputRef.current.value, getSearchOptions());
    }
    const handleNext = () => {
        if (!inputRef.current || !inputRef.current.value) return;
        console.log('forward search for', inputRef.current.value);
        searchAddon.findNext(inputRef.current.value, getSearchOptions());
    }
    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!inputRef.current) return;
        console.log('search input keydown', e.code);
        if (e.code === 'Enter') {
            if (e.shiftKey) {
                handlePrevious();
            } else {
                handleNext();
            }
            e.preventDefault();
        }
    }
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!inputRef.current) return;
        handleNext();
    }

    const handleCaseSensitiveMode = () => {
        if (!inputRef.current) return;
        setCaseSensitive(!caseSensitive);
        clearSearchState();
        searchAddon.findNext(inputRef.current.value, getSearchOptions({ caseSensitive: !caseSensitive }));
    }
    const handleWholeWordMode = () => {
        if (!inputRef.current) return;
        setWholeWord(!wholeWord);
        clearSearchState();
        searchAddon.findNext(inputRef.current.value, getSearchOptions({ wholeWord: !wholeWord }));
    }
    const handleRegexMode = () => {
        if (!inputRef.current) return;
        setRegex(!regex);
        clearSearchState();
        searchAddon.findNext(inputRef.current.value, getSearchOptions({ regex: !regex }));
    }

    //This is required so hotkeys in the page also apply in here
    useEventListener('message', (e: TxMessageEvent) => {
        if (e.data.type !== 'liveConsoleSearchHotkey') return;
        if (e.data.action === 'previous') {
            handlePrevious();
        } else if (e.data.action === 'next') {
            handleNext();
        } else if (e.data.action === 'focus') {
            inputRef.current?.focus();
        }
    });

    if (!show) return null;
    return (
        <div className="absolute top-0 xs:right-4 bg-secondary border z-10 flex items-center justify-center gap-1 xs:gap-4 shadow-xl p-1 rounded-b-lg border-t-0 w-full xs:w-auto flex-wrap">
            <div className="relative">
                <Input
                    ref={inputRef}
                    className="h-8"
                    placeholder="Search string"
                    onKeyDown={handleInputKeyDown}
                    onChange={handleInputChange}
                    onBlur={() => { searchAddon.clearActiveDecoration() }}
                />
                <div className="absolute top-1/2 right-1 transform -translate-y-1/2 flex text-muted-foreground gap-2">
                    <SearchBarButton
                        title="Case Sensitive"
                        isActive={caseSensitive}
                        onClick={handleCaseSensitiveMode}
                    >
                        <CaseSensitiveIcon className="h-5 w-5" />
                    </SearchBarButton>
                    <SearchBarButton
                        title="Whole Word"
                        isActive={wholeWord}
                        onClick={handleWholeWordMode}
                    >
                        <WholeWordIcon className="h-5 w-5" />
                    </SearchBarButton>
                    <SearchBarButton
                        title="Regex"
                        isActive={regex}
                        onClick={handleRegexMode}
                    >
                        <RegexIcon className="h-4 w-5" />
                    </SearchBarButton>
                </div>
            </div>
            <div className="flex grow text-sm text-muted-foreground whitespace-nowrap min-w-[8ch]">
                {resultCount}
            </div>
            <div className="flex gap-2 text-muted-foreground">
                <SearchBarButton
                    title="Previous"
                    onClick={handlePrevious}
                >
                    <ArrowUpIcon className="h-5 w-5" />
                </SearchBarButton>
                <SearchBarButton
                    title="Next"
                    onClick={handleNext}
                >
                    <ArrowDownIcon className="h-5 w-5" />
                </SearchBarButton>
                <SearchBarButton
                    title="Close"
                    onClick={() => { setShow(false) }}
                >
                    <XIcon className="h-5 w-5" />
                </SearchBarButton>
            </div>
        </div>
    );
}
