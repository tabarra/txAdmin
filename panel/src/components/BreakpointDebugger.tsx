export default function BreakpointDebugger() {
    return <div className="sticky bottom-4 w-full flex flex-row justify-center">
        <div className="p-4 flex flex-row gap-4 uppercase justify-center items-center bg-zinc-900/50 w-fit">
            <h1 className="px-2 text-2xl bg-red-500 xs:bg-green-500">xs</h1>
            <h1 className="px-2 text-2xl bg-red-500 sm:bg-green-500">sm</h1>
            <h1 className="px-2 text-2xl bg-red-500 md:bg-green-500">md</h1>
            <h1 className="px-2 text-2xl bg-red-500 lg:bg-green-500">lg</h1>
            <h1 className="px-2 text-2xl bg-red-500 xl:bg-green-500">xl</h1>
            <h1 className="px-2 text-2xl bg-red-500 2xl:bg-green-500">2xl</h1>
        </div>
    </div>;
}
