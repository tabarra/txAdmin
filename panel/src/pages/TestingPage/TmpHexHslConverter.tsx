import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function TmpHexHslConverter() {
    const [hex, setHex] = useState('000000');

    //convert rgb to hsl
    const rgbToHsl = (r: number, g: number, b: number) => {
        r /= 255;
        g /= 255;
        b /= 255;
        const l = Math.max(r, g, b);
        const s = l - Math.min(r, g, b);
        const h = s
            ? l === r
                ? (g - b) / s
                : l === g
                    ? 2 + (b - r) / s
                    : 4 + (r - g) / s
            : 0;

        const hFinal = 60 * h < 0 ? 60 * h + 360 : 60 * h;
        const sFinal = 100 * (s ? (l <= 0.5 ? s / (2 * l - s) : s / (2 - (2 * l - s))) : 0);
        const lFinal = (100 * (2 * l - s)) / 2;
        return `${hFinal.toFixed(1)} ${sFinal.toFixed(1)}% ${lFinal.toFixed(1)}%`;
    }

    const hexToHsl = (hex: string) => {
        //convert hex to rgb
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);

        //convert rgb to hsl
        const hsl = rgbToHsl(r, g, b).replace(/\.00?/g, '');

        return hsl;
    }

    //remove the # prefix if it exists
    const inputOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === '') {
            setHex('')
        } else if (value[0] === '#') {
            setHex(value.slice(1));
        } else {
            setHex(value);
        }
    }

    return (
        <div className="flex flex-col gap-2 max-w-xs">
            <div>
                <label htmlFor="hex-input">Hex Color:</label>
                <div className="flex flex-row justify-start gap-2">
                    <Input
                        id="hex-input"
                        type="text"
                        value={hex}
                        placeholder="000000"
                        onChange={inputOnChange}
                        onFocus={(e) => e.target.select()}
                    />
                    <Button
                        onClick={() => setHex('')}
                        variant="outline"
                    >
                        Clear
                    </Button>
                </div>
            </div>
            <div>
                <label htmlFor="hsl-output">HSL Color:</label>
                <div className="flex flex-row justify-start gap-2">
                    <Input
                        id="hex-output"
                        type="text"
                        value={hexToHsl(hex)}
                        onFocus={(e) => e.target.select()}
                        readOnly
                    />
                    <Button
                        onClick={() => navigator.clipboard.writeText(hexToHsl(hex))}
                        variant="outline"
                    >
                        Copy
                    </Button>
                </div>
            </div>
            <div>
                <label htmlFor="hsl-output">Sanity Check:</label>
                <div className="flex flex-row justify-start gap-0">
                    <div className="w-20 h-10" style={{ backgroundColor: `#${hex}` }}></div>
                    <div className="w-20 h-10" style={{ backgroundColor: `hsl(${hexToHsl(hex)})` }}></div>
                    <div className="w-20 h-10" style={{ backgroundColor: `#${hex}` }}></div>
                    <div className="w-20 h-10" style={{ backgroundColor: `hsl(${hexToHsl(hex)})` }}></div>
                    <div className="w-20 h-10" style={{ backgroundColor: `#${hex}` }}></div>
                    <div className="w-20 h-10" style={{ backgroundColor: `hsl(${hexToHsl(hex)})` }}></div>
                    <div className="w-20 h-10" style={{ backgroundColor: `#${hex}` }}></div>
                    <div className="w-20 h-10" style={{ backgroundColor: `hsl(${hexToHsl(hex)})` }}></div>
                </div>
                <small>NOTE: This calculation is not reliable, if the bar above is striped, it means that the hex and hsl differs, in that case please use <a href="https://products.aspose.app/svg/color-converter/rgb-to-hsl" target="_blank" rel="noopener noreferrer" className="text-accent">this page.</a></small>
            </div>
        </div>
    );
}
