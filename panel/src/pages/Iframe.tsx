type Props = {
    legacyUrl: string;
};

export default function Iframe({ legacyUrl }: Props) {
    //NOTE: if you open adminManager with autofill, the autofill will continue in the searchParams
    //This is an annoying issue to fix, so #wontfix
    const searchParams = location.search ?? '';
    const hashParams = location.hash ?? '';
    return (
        <iframe id="legacyPageiframe"
            src={`./legacy/${legacyUrl}${searchParams}${hashParams}`}
            className="w-full"
        ></iframe>
    );
}
