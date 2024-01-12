import { useEffect, useRef } from "react";
import { hotkeyEventListener } from "@/lib/hotkeyEventListener";

type Props = {
    legacyUrl: string;
};

export default function Iframe({ legacyUrl }: Props) {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    //NOTE: if you open adminManager with autofill, the autofill will continue in the searchParams
    //This is an annoying issue to fix, so #wontfix
    const searchParams = location.search ?? '';
    const hashParams = location.hash ?? '';

    //Listens to hotkeys in the iframe
    useEffect(() => {
        if (!iframeRef.current) return;
        iframeRef.current.contentWindow?.addEventListener('keydown', hotkeyEventListener);
    }, []);

    return (
        <iframe
            ref={iframeRef}
            id="legacyPageIframe" //required for the theme switcher
            src={`./legacy/${legacyUrl}${searchParams}${hashParams}`}
            className="w-full"
        ></iframe>
    );
}
