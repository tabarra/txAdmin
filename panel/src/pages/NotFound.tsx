import InlineCode from "@/components/InlineCode";
import { useSetPageTitle } from "@/hooks/pages";
import { Link } from "wouter";

type Props = {
    params: {
        ['*']: string;
    };
};
export default function NotFound({ params }: Props) {
    const setPageTitle = useSetPageTitle();
    setPageTitle('Not Found');
    return (
        <div className="w-full flex items-center justify-center">
            <div className="text-center">
                <h1 className="bg-fuchsia-600 text-4xl w-fit mx-auto">404 | Not Found</h1>
                <p className="mt-2">
                    The page <InlineCode>/{params['*']}</InlineCode> does not seem to be correct.
                </p>
                <Link href="/" className="text-accent hover:underline">Return to Dashboard?</Link>
            </div>
        </div>
    );
}
