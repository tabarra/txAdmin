import type { Terminal, ITerminalAddon, IDisposable } from '@xterm/xterm';


/**
 * This addon is used to toggle the "scroll down" button based on viewportY and baseY.
 * 
 * References:
 * http://xtermjs.org/docs/guides/using-addons/
 * http://xtermjs.org/docs/api/terminal/interfaces/ibuffer/#basey
 */
export default class ScrollDownAddon implements ITerminalAddon {
    private btnRef: HTMLButtonElement;
    private containerElement: HTMLDivElement;
    private _disposables: IDisposable[] = [];

    constructor(
        btnRef: HTMLButtonElement,
        containerElement: HTMLDivElement
    ) {
        this.btnRef = btnRef;
        this.containerElement = containerElement;
    }

    activate(terminal: Terminal): void {
        //FIXME: hack to get wheel events
        if (!this.containerElement) {
            throw new Error(`containerElement is null`);
        }
        this.containerElement.addEventListener('wheel', (e) => {
            this.checkViewportY(terminal);
        });

        //FIXME: broken, delete the hack above when this is fixed
        // https://github.com/xtermjs/xterm.js/issues/3864
        const onScrollDisposable = terminal.onScroll(() => {
            this.checkViewportY(terminal);
        });
        this._disposables.push(onScrollDisposable);

        const onLineFeedDisposable = terminal.onLineFeed(() => {
            this.checkViewportY(terminal);
        });
        this._disposables.push(onLineFeedDisposable);
    }

    checkViewportY(terminal: Terminal) {
        //If the viewportY is at the bottom, hide the button
        if (terminal.buffer.active.viewportY === terminal.buffer.active.baseY) {
            this.btnRef.classList.add('hidden');
        } else {
            this.btnRef.classList.remove('hidden');
        }

        // console.log({
        //     viewportY: terminal.buffer.active.viewportY,
        //     baseY: terminal.buffer.active.baseY,
        //     rows: terminal.rows,
        // });
    }

    dispose(): void {
        this._disposables.forEach(d => d.dispose());
        this._disposables.length = 0;
    }
}
