"use client";

import {useState, useTransition} from "react";
import {useRouter} from "next/navigation";
import {Check, LoaderCircle, X} from "lucide-react";

import {type Id} from "@gotujto/convex/_generated/dataModel";
import {approveRecipeSubmissionAction, rejectRecipeSubmissionAction} from "@/app/actions";
import {Button} from "@/components/ui/button";
import {Textarea} from "@/components/ui/textarea";

export function RecipeSubmissionActions({submissionId, status}: {submissionId: Id<"recipeSubmissions">; status: "pending" | "approved" | "rejected"}) {
    const router = useRouter();
    const [adminNote, setAdminNote] = useState("");
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    function handleApprove() {
        if (!window.confirm("Zatwierdzic i opublikowac ten przepis?")) return;

        setError(null);
        startTransition(() => {
            void approveRecipeSubmissionAction({submissionId})
                .then(() => router.replace("/admin/recipe-submissions"))
                .catch(caughtError => setError(getErrorMessage(caughtError)));
        });
    }

    function handleReject() {
        setError(null);
        startTransition(() => {
            void rejectRecipeSubmissionAction({
                submissionId,
                adminNote: adminNote.trim() || undefined,
            })
                .then(() => router.replace("/admin/recipe-submissions?status=rejected"))
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
                <p className="mt-1 text-sm text-muted-foreground">Zatwierdzenie od razu tworzy publiczny przepis wraz ze skladnikami, krokami i zdjeciami.</p>
            </div>
            <Textarea value={adminNote} onChange={event => setAdminNote(event.target.value)} maxLength={500} placeholder="Notatka dla autora przy odrzuceniu (opcjonalnie)" />
            {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
            <div className="flex flex-wrap gap-3">
                <Button type="button" disabled={isPending} onClick={handleApprove}><Check className="size-4" />{isPending && <LoaderCircle className="size-4 animate-spin" />}Zatwierdz i opublikuj</Button>
                <Button type="button" disabled={isPending} variant="destructive" onClick={handleReject}><X className="size-4" />Odrzuc</Button>
            </div>
        </section>
    );
}

function getErrorMessage(error: unknown) {
    return error instanceof Error && error.message
        ? error.message
        : "Nie udalo sie zapisac decyzji.";
}
