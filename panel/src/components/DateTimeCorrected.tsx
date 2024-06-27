import { tsToLocaleDateString, tsToLocaleDateTimeString } from "@/lib/utils";
import { txToast } from "./TxToaster";

const clockSkewTolerance = 5 * 60; //5 minutes

type Props = {
    tsFetch: number;
    tsObject: number;
    serverTime: number;
    className?: string;
    isDateOnly?: boolean;
    dateStyle?: 'full' | 'long' | 'medium' | 'short';
    timeStyle?: 'full' | 'long' | 'medium' | 'short';
};

export default function DateTimeCorrected({ tsFetch, tsObject, serverTime, className, isDateOnly, dateStyle, timeStyle }: Props) {
    const serverClockDrift = serverTime - tsFetch; //be positive if server is ahead
    const howFarInThePast = serverTime - tsObject;
    const localTime = tsFetch - howFarInThePast;

    const clockDriftBtnHandler = () => {
        txToast.warning(`This means that the server clock is ${Math.abs(serverClockDrift)} seconds ${serverClockDrift > 0 ? 'ahead' : 'behind'} your computer time. Make sure both your computer and the server have their clocks synchronized.`);
    }
    const displayTime = isDateOnly
        ? tsToLocaleDateString(localTime, dateStyle ?? 'medium')
        : tsToLocaleDateTimeString(localTime, dateStyle ?? 'medium', timeStyle ?? 'short')
    return <span
        className={className}
        title={tsToLocaleDateTimeString(localTime, 'long', 'long')}
    >
        {displayTime}
        {Math.abs(serverClockDrift) > clockSkewTolerance && (
            <button
                className="ml-1 text-warning-inline"
                onClick={clockDriftBtnHandler}
            >(clock drift)</button>
        )}
    </span>
}
