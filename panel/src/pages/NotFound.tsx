import { Link } from "wouter";

type Props = {
    params: {
        fullPath: string;
    };
};
export default function NotFound({ params }: Props) {
    return (
        <div className="w-full flex items-center justify-center">
            <div className="text-center">
                <h1 className="bg-fuchsia-600 text-4xl w-fit mx-auto">404 | Not Found</h1>
                <p className="mt-2">
                    The page <code className="font-mono text-muted-foreground bg-muted px-[0.25rem]">/{params.fullPath}</code> does not seem to be correct.
                </p>
                <Link href="/" className="text-pink-600 hover:underline">Return to Dashboard?</Link>
            </div>
        </div>
    );
}
