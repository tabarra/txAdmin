import { useSetAtom } from "jotai";
import TmpAuthState from "./TmpAuthState";
import TmpColors from "./TmpColors";
import TmpMarkdown from "./TmpMarkdown";
import TmpTerminal from "./TmpTerminal";
import TmpWarningBarState from "./TmpWarningBarState";
import { useSetPageTitle } from "@/hooks/pages";
import TmpSocket from "./TmpSocket";
import TmpToasts from "./TmpToasts";


export default function TestingPage() {
    const setPageTitle = useSetPageTitle();
    setPageTitle();

    return <div className="flex flex-col gap-4 w-full m-4">
        {/* <TmpToasts /> */}
        {/* <TmpSocket /> */}
        {/* <TmpWarningBarState /> */}
        {/* <TmpAuthState /> */}
        {/* <TmpTerminal /> */}
        {/* <TmpMarkdown /> */}
        {/* <TmpColors /> */}
    </div>;
}
