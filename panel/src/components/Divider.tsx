type DividerProps = {
    text?: string;
};

export default function Divider({ text }: DividerProps) {
    return (
        <div className="w-full flex flex-nowrap items-center justify-center gap-2">
            <div className="grow border-b" />
            {text && <div className="flex justify-center text-xs text-muted-foreground">
                {text}
            </div>}
            {text && <div className="grow border-b" />}
        </div>
    )
}
