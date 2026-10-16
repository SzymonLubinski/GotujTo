"use client";

import {Button} from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";

type ConfirmationSheetProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    confirmLabel: string;
    onConfirm: () => void;
    pending?: boolean;
    destructive?: boolean;
};

export function ConfirmationSheet({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel,
    onConfirm,
    pending = false,
    destructive = false,
}: ConfirmationSheetProps) {
    function handleConfirm() {
        onOpenChange(false);
        onConfirm();
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="inset-x-4 bottom-4 mx-auto h-auto w-auto max-w-md rounded-2xl border bg-background p-0" showCloseButton={false}>
                <SheetHeader className="px-5 pb-2 pt-5 text-left">
                    <SheetTitle>{title}</SheetTitle>
                    <SheetDescription>{description}</SheetDescription>
                </SheetHeader>
                <SheetFooter className="flex-row justify-end px-5 pb-5 pt-3">
                    <Button type="button" variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
                        Anuluj
                    </Button>
                    <Button type="button" variant={destructive ? "destructive" : "default"} disabled={pending} onClick={handleConfirm}>
                        {confirmLabel}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
