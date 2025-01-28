import { useId } from "react";
import { Label } from "./ui/label";
import { RadioGroupItem } from "./ui/radio-group";
import { cn } from "@/lib/utils";
import { RadioGroupIndicator } from "@radix-ui/react-radio-group";

type BigRadioItemProps = {
    value: string;
    title: string;
    desc: React.ReactNode;
    groupValue: string | undefined;
}

export default function BigRadioItem(props: BigRadioItemProps) {
    const radioId = 'radio' + useId();
    return (
        <div className="group">
            <Label
                htmlFor={radioId}
                className="flex items-center gap-3 border rounded-lg p-3 cursor-pointer hover:bg-card data-[state=checked]:border-primary/50 data-[state=checked]:bg-muted select-none"
                data-state={props.groupValue === props.value ? 'checked' : 'unchecked'}
            >
                <RadioGroupItem value={props.value} id={radioId} />
                <div className="space-y-1">
                    <span className="font-bold">{props.title}</span>
                    <p className="text-sm text-muted-foreground">{props.desc}</p>
                </div>
            </Label>
        </div>
    )
}
