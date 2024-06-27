import { Loader2Icon } from "lucide-react";

type Props = {
    msg?: string;
}
export default function GenericSpinner({ msg }: Props) {
    return <div className="flex items-center gap-1 text-xl leading-relaxed text-muted-foreground">
        <Loader2Icon className="inline animate-spin h-5" /> {msg}
    </div>;
}
