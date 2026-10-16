"use client";

import {LoaderCircle, ShieldCheck, Trash2} from "lucide-react";
import {useRouter} from "next/navigation";
import {useState, useTransition} from "react";

import {deleteReportedCommentAction, dismissCommentReportsAction} from "@/app/actions";
import {Button} from "@/components/ui/button";

type CommentReportActionsProps = {
    targetType: "recipe" | "blog";
    commentId: string;
};

function getErrorMessage(error: unknown) {
    return error instanceof Error && error.message
        ? error.message
        : "Nie udalo sie zapisac decyzji.";
}

export function CommentReportActions({targetType, commentId}: CommentReportActionsProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    function handleDismiss() {
        setError(null);
        startTransition(() => {
            void dismissCommentReportsAction({targetType, commentId})
                .then(() => router.refresh())
                .catch(caughtError => setError(getErrorMessage(caughtError)));
        });
    }

    function handleDelete() {
        if (!window.confirm("Usunac komentarz i wszystkie jego zgloszenia?")) {
            return;
        }

        setError(null);
        startTransition(() => {
            void deleteReportedCommentAction({targetType, commentId})
                .then(() => router.refresh())
                .catch(caughtError => setError(getErrorMessage(caughtError)));
        });
    }

    return (
        <div className="space-y-2 sm:text-right">
            <div className="flex flex-wrap gap-2 sm:justify-end">
                <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={handleDismiss}>
                    {isPending ? <LoaderCircle className="size-3.5 animate-spin" /> : <ShieldCheck className="size-3.5" />}
                    Pozostaw
                </Button>
                <Button type="button" variant="destructive" size="sm" disabled={isPending} onClick={handleDelete}>
                    <Trash2 className="size-3.5" />
                    Usun komentarz
                </Button>
            </div>
            {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
        </div>
    );
}
