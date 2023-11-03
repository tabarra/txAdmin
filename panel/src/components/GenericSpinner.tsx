import { LuLoader2 } from "react-icons/lu";

type Props = {
    msg?: string;
}
export default function GenericSpinner({ msg }: Props) {
    return <div className="text-xl text-muted-foreground">
        <LuLoader2 className="inline animate-spin" /> {msg}
    </div>;
}
