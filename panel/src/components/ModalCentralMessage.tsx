export default function ModalCentralMessage({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex items-center justify-center min-h-[16.5rem] text-xl p1 text-muted-foreground">
            {children}
        </div>
    )
}
