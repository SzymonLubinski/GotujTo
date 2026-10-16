"use client";

import {Flag, Trash2} from "lucide-react";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {useMutation, useConvexAuth} from "convex/react";
import {toast} from "sonner";

import {api} from "@gotujto/convex/_generated/api";
import type {Id} from "@gotujto/convex/_generated/dataModel";
import {Button} from "@/components/ui/button";
import {ConfirmationSheet} from "@/components/ui/confirmation-sheet";
import {getUserFacingErrorMessage} from "@/lib/user-facing-error";

type CommentActionButtonProps = {
    targetType: "recipe";
    commentId: Id<"comments">;
    isOwn: boolean;
} | {
    targetType: "blog";
    commentId: Id<"blogComments">;
    isOwn: boolean;
};

export function ReportCommentButton({targetType, commentId, isOwn}: CommentActionButtonProps) {
    const router = useRouter();
    const {isAuthenticated, isLoading} = useConvexAuth();
    const [confirmationOpen, setConfirmationOpen] = useState(false);
    const reportRecipeComment = useMutation(api.userDashboard.reportRecipeComment);
    const reportBlogComment = useMutation(api.userDashboard.reportBlogComment);
    const deleteOwnRecipeComment = useMutation(api.userDashboard.deleteOwnRecipeComment);
    const deleteOwnBlogComment = useMutation(api.userDashboard.deleteOwnBlogComment);

    function requestConfirmation() {
        if (isLoading) {
            return;
        }

        if (!isAuthenticated) {
            toast.info(isOwn ? "Zaloguj się, aby usunąć komentarz." : "Zaloguj się, aby zgłosić komentarz.");
            router.push("/login");
            return;
        }

        setConfirmationOpen(true);
    }

    async function handleAction() {
        try {
            if (isOwn) {
                if (targetType === "recipe") {
                    await deleteOwnRecipeComment({commentId});
                } else {
                    await deleteOwnBlogComment({commentId});
                }

                toast.success("Komentarz został usunięty.");
                return;
            }

            const created = targetType === "recipe"
                ? await reportRecipeComment({commentId})
                : await reportBlogComment({commentId});

            toast.success(created ? "Komentarz został zgłoszony." : "Ten komentarz jest już zgłoszony przez Ciebie.");
        } catch (error) {
            toast.error(getUserFacingErrorMessage(
                error,
                isOwn
                    ? "Nie udało się usunąć komentarza. Spróbuj ponownie."
                    : "Nie udało się zgłosić komentarza. Spróbuj ponownie.",
            ));
        }
    }

    const actionLabel = isOwn ? "Usuń komentarz" : "Zgłoś komentarz";

    return (
        <>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={actionLabel}
                title={actionLabel}
                onClick={requestConfirmation}
                className={isOwn
                    ? "size-7 shrink-0 text-white/35 hover:bg-red-500/10 hover:text-red-300"
                    : "size-7 shrink-0 text-white/35 hover:bg-white/10 hover:text-amber-200"}
            >
                {isOwn ? <Trash2 className="size-3.5" /> : <Flag className="size-3.5" />}
            </Button>
            <ConfirmationSheet
                open={confirmationOpen}
                onOpenChange={setConfirmationOpen}
                title={isOwn ? "Usunąć komentarz?" : "Zgłosić komentarz?"}
                description={isOwn
                    ? "Ta operacja jest nieodwracalna."
                    : "Zgłoszenie zostanie przekazane administratorowi do moderacji."}
                confirmLabel={actionLabel}
                onConfirm={() => void handleAction()}
                destructive={isOwn}
            />
        </>
    );
}
