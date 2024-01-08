import type { Terminal, ITerminalAddon, IDisposable } from '@xterm/xterm';


/**
 * This addon is used to toggle the "scroll down" button based on viewportY and baseY.
 * 
 * References:
 * http://xtermjs.org/docs/guides/using-addons/
 * http://xtermjs.org/docs/api/terminal/interfaces/ibuffer/#basey
 */
export default class ScrollDownAddon implements ITerminalAddon {
    private btnRef: React.RefObject<HTMLButtonElement>;
    private _disposables: IDisposable[] = [];

    constructor(btnRef: React.RefObject<HTMLButtonElement>) {
        this.btnRef = btnRef;
    }

    activate(terminal: Terminal): void {
        const isAtBottom = () => {
            // console.log({
            //     viewportY: terminal.buffer.active.viewportY,
            //     baseY: terminal.buffer.active.baseY,
            //     rows: terminal.rows,
            // });
            return terminal.buffer.active.viewportY === terminal.buffer.active.baseY;
        };

        const onScrollDisposable = terminal.onScroll(() => {
            if (this.btnRef.current && isAtBottom()) {
                this.btnRef.current.classList.add('hidden');
            }
        });
        this._disposables.push(onScrollDisposable);

        const onLineFeedDisposable = terminal.onLineFeed(() => {
            if (this.btnRef.current && !isAtBottom()) {
                this.btnRef.current.classList.remove('hidden');
            }
        });
        this._disposables.push(onLineFeedDisposable);
    }

    dispose(): void {
        this._disposables.forEach(d => d.dispose());
        this._disposables.length = 0;
    }
}
