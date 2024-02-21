const fillerLines: any[] = [];
for (let i = 0; i < 100; i++) {
    const text = '='.repeat(i % 48);
    const hue = Math.floor((i / 50) * 360);
    fillerLines.push(<div key={i} style={{ backgroundColor: `hsl(${hue}deg 75% 65%)` }}>{text}</div>);
}

export default function TmpFiller() {
    return (
        <div className="mx-auto text-center">
            {fillerLines}
        </div>
    );
}
