import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";


/**
 * Atoms
 */
const liveConsoleHistoryAtom = atomWithStorage<string[]>('liveConsoleCommandHistory', []);
const liveConsoleBookmarksAtom = atomWithStorage<string[]>('liveConsoleCommandBookmarks', []);
const historyMaxLength = 50;


/**
 * Hooks
 */
export const useLiveConsoleHistory = () => {
    const [history, setHistory] = useAtom(liveConsoleHistoryAtom);
    return {
        history,
        setHistory,
        appendHistory: (cmd: string) => {
            const newHistory = history.filter((h) => h !== cmd);
            if (newHistory.unshift(cmd) > historyMaxLength) newHistory.pop();
            setHistory(newHistory);
        },
        wipeHistory: () => {
            setHistory([]);
        }
    };
};

export const useLiveConsoleBookmarks = () => {
    const [bookmarks, setBookmarks] = useAtom(liveConsoleBookmarksAtom);
    return {
        bookmarks,
        addBookmark: (cmd: string) => {
            if (!bookmarks.includes(cmd)) {
                setBookmarks([cmd, ...bookmarks]);
            }
        },
        removeBookmark: (cmd: string) => {
            setBookmarks(bookmarks.filter((b) => b !== cmd));
        }
    };
}
