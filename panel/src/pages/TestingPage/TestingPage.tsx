import { useSetPageTitle } from "@/hooks/pages";
import TmpAuthState from "./TmpAuthState";
import TmpColors from "./TmpColors";
import TmpMarkdown from "./TmpMarkdown";
import TmpWarningBarState from "./TmpWarningBarState";
import TmpSocket from "./TmpSocket";
import TmpToasts from "./TmpToasts";
import TmpApi from "./TmpApi";
import TmpFiller from "./TmpFiller";
import TmpDndSortable from "./TmpDndSortable";
import TmpSwr from "./TmpSwr";


export default function TestingPage() {
    const setPageTitle = useSetPageTitle();
    setPageTitle();

    return <div className="flex flex-col gap-4 w-full">
        <TmpFiller />
        {/* <TmpTestTables /> */}
        {/* <TmpApi /> */}
        {/* <TmpToasts /> */}
        {/* <TmpSocket /> */}
        {/* <TmpWarningBarState /> */}
        {/* <TmpAuthState /> */}
        {/* <TmpMarkdown /> */}
        {/* <TmpColors /> */}
        {/* <TmpDndSortable /> */}
        {/* <TmpSwr /> */}
    </div>;
}
