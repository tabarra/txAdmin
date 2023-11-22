

import { useSocketio } from "@/hooks/socketio";
import TmpAuthState from "./TmpAuthState";
import TmpColors from "./TmpColors";
import TmpMarkdown from "./TmpMarkdown";
import TmpTerminal from "./TmpTerminal";
import TmpWarningBarState from "./TmpWarningBarState";


export default function TestingPage() {
    useSocketio();
    return <div className="flex flex-col gap-4 w-full m-4">
        <TmpWarningBarState />
        {/* <TmpAuthState /> */}
        {/* <TmpTerminal /> */}
        {/* <TmpMarkdown /> */}
        {/* <TmpColors /> */}
    </div>;
}
