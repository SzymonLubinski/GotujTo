"use client";

import {useState, useTransition} from "react";
import {useRouter} from "next/navigation";
import {Check, LoaderCircle, X} from "lucide-react";

import {type Id} from "@gotujto/convex/_generated/dataModel";
import {approveBlogSubmissionAction, rejectBlogSubmissionAction} from "@/app/actions";
import {Button} from "@/components/ui/button";
import {ConfirmationSheet} from "@/components/ui/confirmation-sheet";
import {Textarea} from "@/components/ui/textarea";

function getErrorMessage(error: unknown) {
    return error instanceof Error && error.message
        ? error.message
        : "Nie udalo sie zapisac decyzji.";
}

export function BlogSubmissionActions({submissionId, status}: {submissionId: Id<"blogSubmissions">; status: "pending" | "approved" | "rejected"}) {
    const router = useRouter();
    const [adminNote, setAdminNote] = useState("");
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [approveConfirmationOpen, setApproveConfirmationOpen] = useState(false);

    function handleApprove() {
        setError(null);
        startTransition(() => {
            void approveBlogSubmissionAction({submissionId})
                .then(() => router.replace("/admin/blog-submissions"))
                .catch(caughtError => setError(getErrorMessage(caughtError)));
        });
    }

    function handleReject() {
        setError(null);
        startTransition(() => {
            void rejectBlogSubmissionAction({
                submissionId,
                adminNote: adminNote.trim() || undefined,
            })
                .then(() => router.replace("/admin/blog-submissions?status=rejected"))
                .catch(caughtError => setError(getErrorMessage(caughtError)));
        });
    }

    if (status !== "pending") {
        return <p className="text-sm text-muted-foreground">To zgloszenie zostalo juz rozpatrzone.</p>;
    }

    return (
        <section className="space-y-4 rounded-2xl border p-5">
            <div>
                <h2 className="text-lg font-semibold">Decyzja administratora</h2>
                <p className="mt-1 text-sm text-muted-foreground">Zatwierdzenie od razu publikuje wpis na blogu.</p>
            </div>
            <Textarea value={adminNote} onChange={event => setAdminNote(event.target.value)} maxLength={500} placeholder="Notatka dla autora przy odrzuceniu (opcjonalnie)" />
            {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
            <div className="flex flex-wrap gap-3">
                <Button type="button" disabled={isPending} onClick={() => setApproveConfirmationOpen(true)}><Check className="size-4" />{isPending && <LoaderCircle className="size-4 animate-spin" />}Zatwierdz i opublikuj</Button>
                <Button type="button" disabled={isPending} variant="destructive" onClick={handleReject}><X className="size-4" />Odrzuc</Button>
            </div>
            <ConfirmationSheet
                open={approveConfirmationOpen}
                onOpenChange={setApproveConfirmationOpen}
                title="Opublikować wpis?"
                description="Wpis będzie od razu widoczny publicznie na blogu."
                confirmLabel="Zatwierdź i opublikuj"
                onConfirm={handleApprove}
                pending={isPending}
            />
        </section>
    );
}
