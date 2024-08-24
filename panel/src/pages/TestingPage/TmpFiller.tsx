export default function TmpFiller({ count = 100, maxWidth = 48 }: { count?: number, maxWidth?: number }) {
    const fillerLines: any[] = [];
    const initialOffset = Math.floor(Math.random() * maxWidth);
    for (let i = 0; i < count; i++) {
        const currVal = i + initialOffset;
        const text = '='.repeat(currVal % maxWidth);
        const hue = Math.floor((currVal / 50) * 360);
        fillerLines.push(<div key={currVal} style={{ backgroundColor: `hsl(${hue}deg 75% 65%)`, height: '1.5rem' }}>{text}</div>);
    }
    return (
        <div className="mx-auto text-center text-black">
            {fillerLines}
        </div>
    );
}
