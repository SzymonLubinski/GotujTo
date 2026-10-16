import {fetchQuery} from "convex/nextjs";
import {Clock, Users} from "lucide-react";
import {Suspense} from "react";

import {api} from "@gotujto/convex/_generated/api";
import {SubmissionList} from "@/components/web/admin/SubmissionList";
import {getSubmissionStatus, SubmissionStatusTabs} from "@/components/web/admin/SubmissionStatusTabs";
import {getAdminSecret} from "@/lib/auth/getAdminSecret";
import {requireAdminRequest} from "@/lib/auth/requireAdminRequest";

type RecipeSubmissionsPageProps = {
    searchParams: Promise<{
        status?: string | string[];
    }>;
};

export default function RecipeSubmissionsPage(props: RecipeSubmissionsPageProps) {
    return <Suspense fallback={<RecipeSubmissionsLoading />}><RecipeSubmissionsContent {...props} /></Suspense>;
}

async function RecipeSubmissionsContent({searchParams}: RecipeSubmissionsPageProps) {
    await requireAdminRequest();

    const params = await searchParams;
    const status = getSubmissionStatus(params.status);
    const submissions = await fetchQuery(api.userDashboard.getRecipeSubmissionsForAdmin, {
        adminSecret: getAdminSecret(),
        status,
        limit: 50,
    });

    return (
        <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
            <header className="mb-8">
                <p className="text-sm text-muted-foreground">Przepisy od użytkowników</p>
                <h1 className="mt-1 text-3xl font-bold tracking-tight">Zgłoszenia przepisów</h1>
                <p className="mt-2 text-sm text-muted-foreground">Sprawdź kompletne dane przepisu, a następnie zatwierdź publikację lub odrzuć zgłoszenie.</p>
            </header>

            <SubmissionStatusTabs basePath="/admin/recipe-submissions" status={status} ariaLabel="Status zgłoszeń przepisów" />
            <SubmissionList
                emptyMessage="Brak zgłoszeń w tej kategorii."
                items={submissions.map(submission => ({
                    id: submission._id,
                    title: submission.name,
                    authorName: submission.authorName,
                    meta: <><span className="inline-flex items-center gap-1"><Clock className="size-3.5" />{submission.cookingMinutes} min</span><span className="inline-flex items-center gap-1"><Users className="size-3.5" />{submission.servings} porcji</span><span>{formatDate(submission.createdAt)}</span></>,
                    href: submission.hasCompleteRecipeData ? `/admin/recipe-submissions/${submission._id}` : undefined,
                    unavailableMessage: "Starsze, niepełne zgłoszenie",
                }))}
            />
        </main>
    );
}

function RecipeSubmissionsLoading() {
    return <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6"><div className="h-9 w-64 animate-pulse rounded bg-muted" /><div className="mt-8 h-40 animate-pulse rounded bg-muted" /></main>;
}

function formatDate(timestamp: number) {
    return new Intl.DateTimeFormat("pl-PL", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(timestamp);
}
