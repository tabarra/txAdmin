type Props = {
    legacyUrl: string;
};

export default function Iframe({ legacyUrl }: Props) {
    const searchParams = location.search ?? '';
    return (
        <iframe
            src={`./legacy/${legacyUrl}${searchParams}`}
            className="w-full bg-lime-500"
        ></iframe>
    );
}
