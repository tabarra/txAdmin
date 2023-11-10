import { Loader2 } from "lucide-react";

type Props = {
    msg?: string;
}
export default function GenericSpinner({ msg }: Props) {
    return <div className="text-xl text-muted-foreground">
        <Loader2 className="inline animate-spin" /> {msg}
    </div>;
}
