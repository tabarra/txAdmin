export default function TestingPage() {
    return (
        <pre>
            {JSON.stringify(window.txConsts.preAuth, null, 2)}
        </pre>
    );
}
