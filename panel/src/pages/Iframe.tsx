type Props = {
    legacyUrl: string;
};

export default function Iframe({ legacyUrl }: Props) {
    const searchParams = location.search ?? '';
    const hashParams = location.hash ?? '';
    return (
        <iframe id="legacyPageiframe"
            src={`./legacy/${legacyUrl}${searchParams}${hashParams}`}
            className="w-full"
        ></iframe>
    );
}
