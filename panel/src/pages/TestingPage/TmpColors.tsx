import { Button } from "@/components/ui/button";
import { PersonStandingIcon } from "lucide-react";
import TmpHexHslConverter from "./TmpHexHslConverter";

export default function TmpColors() {
    return <>
        <div className="mx-4 flex space-x-4">
            <div className="space-y-2 w-48">
                <div className="w-full p-1 bg-primary text-primary-foreground">primary</div>
                <div className="w-full p-1 bg-secondary text-secondary-foreground">secondary</div>
                <div className="w-full p-1 bg-muted text-muted-foreground">muted</div>
                <div className="w-full p-1 bg-accent text-accent-foreground">accent</div>
                <div className="w-full p-1 bg-card text-card-foreground border">card + border</div>
                <div className="w-full p-1 bg-destructive text-destructive-foreground">destructive</div>
                <div className="w-full p-1 bg-warning text-warning-foreground">warning</div>
                <div className="w-full p-1 bg-success text-success-foreground">success</div>
                <div className="w-full p-1 bg-info text-info-foreground">info</div>
            </div>
            <div className="space-y-2 w-48">
                <div className="w-full p-1 border text-destructive-inline">destructive</div>
                <div className="w-full p-1 border text-warning-inline">warning</div>
                <div className="w-full p-1 border text-success-inline">success</div>
                <div className="w-full p-1 border text-info-inline">info</div>
                <div className="w-full p-1 bg-card text-destructive-inline">destructive</div>
                <div className="w-full p-1 bg-card text-warning-inline">warning</div>
                <div className="w-full p-1 bg-card text-success-inline">success</div>
                <div className="w-full p-1 bg-card text-info-inline">info</div>
            </div>
            <div className="border-l-2 border-border"></div>
            <div className="space-y-2 flex flex-col items-center">
                <Button size="sm" variant="default">default</Button>
                <Button size="sm" variant="secondary">secondary</Button>
                <Button size="sm" variant="destructive">destructive</Button>
                <Button size="sm" variant="warning">warning</Button>
                <Button size="sm" variant="success">success</Button>
                <Button size="sm" variant="info">info</Button>
                <Button size="sm" variant="outline">outline</Button>
                <Button size="sm" variant="ghost">ghost</Button>
                <Button size="sm" variant="link">link</Button>
                <Button size="sm"><PersonStandingIcon /> icon</Button>
                <Button size="sm" disabled>disabled</Button>
                <Button size="icon" variant="outline"><PersonStandingIcon /></Button>
            </div>
            <div className="border-l-2 border-border"></div>
            <div>
                <TmpHexHslConverter />
            </div>
        </div>
    </>;
}
