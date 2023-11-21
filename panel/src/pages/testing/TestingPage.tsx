

import TmpAuthState from "./TmpAuthState";
import TmpColors from "./TmpColors";
import TmpMarkdown from "./TmpMarkdown";
import TmpTerminal from "./TmpTerminal";
import TmpUpdateState from "./TmpUpdateState";


export default function TestingPage() {
    return <div className="flex flex-col gap-4 w-full m-4">
        <TmpUpdateState />
        {/* <TmpAuthState /> */}
        {/* <TmpTerminal /> */}
        {/* <TmpMarkdown /> */}
        {/* <TmpColors /> */}
    </div>;
}
