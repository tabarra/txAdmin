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
import { useEffect } from "react";
import TmpJsonEditor from "./TmpJsonEditor";
import TmpPageHeader from "./TmpPageHeader";


export default function TestingPage() {
    const setPageTitle = useSetPageTitle();
    setPageTitle();

    // useEffect(() => {
    //     return () => console.clear();
    // }, []);

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
        {/* <div className="mx-auto">
            <TmpServerCard />
        </div> */}
        {/* <TmpJsonEditor /> */}
        {/* <TmpPageHeader /> */}
    </div>;
}
