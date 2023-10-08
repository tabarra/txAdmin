type Props = {
    params: {
        '*': string;
    };
};
export default function NotFound() {
    console.log(location);
    return (
        <div className="w-full flex items-center justify-center">
            <div className="text-center">
                <h1 className="bg-fuchsia-600 text-4xl">404 | Not Found</h1>
                <p className="mt-2">
                    Page <span className="font-mono text-muted-foreground">xxxxx</span> does not seem to be correct.
                </p>
            </div>
        </div>
    );
}
