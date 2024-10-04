import { debounce } from 'throttle-debounce';
import { useRef, useEffect, useCallback, memo } from 'react';
import { Loader2Icon } from 'lucide-react';

type SizeType = {
    width: number;
    height: number;
};

type DebouncedResizeContainerProps = {
    delay?: number;
    onDebouncedResize: ({ width, height }: SizeType) => void;
    children: React.ReactNode;
};

/**
 * A container that will call onDebouncedResize with the width and height of the container after a resize event.
 */
function DebouncedResizeContainerInner({
    delay,
    onDebouncedResize,
    children,
}: DebouncedResizeContainerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const loaderRef = useRef<HTMLDivElement>(null);
    const childRef = useRef<HTMLDivElement>(null);
    const lastMeasure = useRef<SizeType>({ width: 0, height: 0 });
    if (delay === undefined) delay = 250;

    const updateSizeState = () => {
        if (!containerRef.current || !containerRef.current.parentNode) return;
        const measures = {
            width: containerRef.current.clientWidth,
            height: containerRef.current.clientHeight
        }
        lastMeasure.current = measures;
        onDebouncedResize(measures);
        childRef.current!.style.visibility = 'visible';
        loaderRef.current!.style.visibility = 'hidden';
    }

    const debouncedResizer = useCallback(
        debounce(delay, updateSizeState, { atBegin: false }),
        [containerRef]
    );

    useEffect(() => {
        if (!containerRef.current) return;
        const resizeObserver = new ResizeObserver(() => {
            const currHeight = containerRef.current!.clientHeight;
            const currWidth = containerRef.current!.clientWidth;
            if (currHeight === 0 || currWidth === 0) return;
            if (lastMeasure.current.width === currWidth && lastMeasure.current.height === currHeight) return;
            if (lastMeasure.current.width === 0 || lastMeasure.current.height === 0) {
                updateSizeState();
            } else {
                debouncedResizer();
                childRef.current!.style.visibility = 'hidden';
                loaderRef.current!.style.visibility = 'visible';
            }
        });
        resizeObserver.observe(containerRef.current);
        updateSizeState();
        return () => resizeObserver.disconnect();
    }, [containerRef]);

    return (
        <div
            ref={containerRef}
            style={{
                height: '100%',
                width: '100%',
                position: 'relative'
            }}
        >
            <div
                ref={loaderRef}
                className="absolute inset-0 flex items-center justify-center"
            >
                <Loader2Icon className="animate-spin size-16 text-muted-foreground" />
            </div>
            <div
                className="absolute inset-0"
                ref={childRef}
            >
                {children}
            </div>
        </div>
    );
}

export default memo(DebouncedResizeContainerInner);
