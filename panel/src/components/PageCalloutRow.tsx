import React, { useEffect, useState } from 'react';

const easeOutQuart = (t: number) => 1 - (--t) * t * t * t;
const frameDuration = 1000 / 60;

type CountUpAnimationProps = {
    countTo: number;
    duration?: number;
};

//Snippet from: https://jshakespeare.com/simple-count-up-number-animation-javascript-react/
const CountUpAnimation = ({ countTo, duration = 1250 }: CountUpAnimationProps) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let frame = 0;
        const totalFrames = Math.round(duration / frameDuration);
        const counter = setInterval(() => {
            frame++;
            const progress = easeOutQuart(frame / totalFrames);
            setCount(countTo * progress);

            if (frame === totalFrames) {
                clearInterval(counter);
            }
        }, frameDuration);
    }, []);

    return Math.floor(count).toLocaleString("en-US");
};

function NumberLoading() {
    return (
        <div className="h-7 w-28 animate-pulse rounded-md bg-muted" />
    )
}


export type PageCalloutProps = {
    label: string;
    icon: React.ReactNode;
    value: number | false;
    prefix?: string;
}

export type PageCalloutRowProps = {
    callouts: PageCalloutProps[];
};
export default function PageCalloutRow({ callouts }: PageCalloutRowProps) {
    if (callouts.length !== 4) return null;

    return (
        <div className="grid px-2 md:px-0 gap-2 xs:gap-4 grid-cols-2 lg:grid-cols-4 mb-4 md:mb-6">
            <div className="py-2 px-4 rounded-lg border shadow-sm">
                <div className="flex flex-row items-center justify-between space-y-0 pb-2 text-muted-foreground">
                    <h3 className="tracking-tight text-sm font-medium line-clamp-1">{callouts[0].label}</h3>
                    <div className='hidden xs:block'>{callouts[0].icon}</div>
                </div>
                {callouts[0].value === false ? (
                    <NumberLoading />
                ) : (
                    <div className="text-xl xs:text-2xl font-bold">
                        {callouts[0].prefix}<CountUpAnimation countTo={callouts[0].value} />
                    </div>
                )}
            </div>
            <div className="py-2 px-4 rounded-lg border shadow-sm">
                <div className="flex flex-row items-center justify-between space-y-0 pb-2 text-muted-foreground">
                    <h3 className="tracking-tight text-sm font-medium line-clamp-1">{callouts[1].label}</h3>
                    <div className='hidden xs:block'>{callouts[1].icon}</div>
                </div>
                {callouts[1].value === false ? (
                    <NumberLoading />
                ) : (
                    <div className="text-xl xs:text-2xl font-bold">
                        {callouts[1].prefix}<CountUpAnimation countTo={callouts[1].value} />
                    </div>
                )}
            </div>
            <div className="py-2 px-4 rounded-lg border shadow-sm">
                <div className="flex flex-row items-center justify-between space-y-0 pb-2 text-muted-foreground">
                    <h3 className="tracking-tight text-sm font-medium line-clamp-1">{callouts[2].label}</h3>
                    <div className='hidden xs:block'>{callouts[2].icon}</div>
                </div>
                {callouts[2].value === false ? (
                    <NumberLoading />
                ) : (
                    <div className="text-xl xs:text-2xl font-bold">
                        {callouts[2].prefix}<CountUpAnimation countTo={callouts[2].value} />
                    </div>
                )}
            </div>
            <div className="py-2 px-4 rounded-lg border shadow-sm">
                <div className="flex flex-row items-center justify-between space-y-0 pb-2 text-muted-foreground">
                    <h3 className="tracking-tight text-sm font-medium line-clamp-1">{callouts[3].label}</h3>
                    <div className='hidden xs:block'>{callouts[3].icon}</div>
                </div>
                {callouts[3].value === false ? (
                    <NumberLoading />
                ) : (
                    <div className="text-xl xs:text-2xl font-bold">
                        {callouts[3].prefix}<CountUpAnimation countTo={callouts[3].value} />
                    </div>
                )}
            </div>
        </div >
    )
}
