import { useId } from "react";


/**
 * Just like React.useId, but with a context prefix.
 * NOTE: not being used anywhere, for now
 */
export default function useIdForContext(ctx: string) {
    const ctxId = ctx + useId();
    return (id: string) => {
        return ctxId + id;
    }
}
