import {fetchQuery} from "convex/nextjs";
import {FileText} from "lucide-react";
import {Suspense} from "react";

import {api} from "@gotujto/convex/_generated/api";
import {SubmissionList} from "@/components/web/admin/SubmissionList";
import {getSubmissionStatus, SubmissionStatusTabs} from "@/components/web/admin/SubmissionStatusTabs";
import {getAdminSecret} from "@/lib/auth/getAdminSecret";
import {requireAdminRequest} from "@/lib/auth/requireAdminRequest";

type BlogSubmissionsPageProps = {
    searchParams: Promise<{
        status?: string | string[];
    }>;
};

export default function BlogSubmissionsPage(props: BlogSubmissionsPageProps) {
    return <Suspense fallback={<BlogSubmissionsLoading />}><BlogSubmissionsContent {...props} /></Suspense>;
}

async function BlogSubmissionsContent({searchParams}: BlogSubmissionsPageProps) {
    await requireAdminRequest();

    const params = await searchParams;
    const status = getSubmissionStatus(params.status);
    const submissions = await fetchQuery(api.userDashboard.getBlogSubmissionsForAdmin, {
        adminSecret: getAdminSecret(),
        status,
        limit: 50,
    });

    return (
        <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
            <header className="mb-8">
                <p className="text-sm text-muted-foreground">Wpisy od użytkowników</p>
                <h1 className="mt-1 text-3xl font-bold tracking-tight">Zgłoszenia blogowe</h1>
                <p className="mt-2 text-sm text-muted-foreground">Sprawdź treść wpisu, a następnie zatwierdź publikację albo odrzuć zgłoszenie.</p>
            </header>

            <SubmissionStatusTabs basePath="/admin/blog-submissions" status={status} ariaLabel="Status zgłoszeń blogowych" />
            <SubmissionList
                emptyMessage="Brak zgłoszeń w tej kategorii."
                items={submissions.map(submission => ({
                    id: submission._id,
                    title: submission.title,
                    authorName: submission.authorName,
                    meta: <><span className="inline-flex items-center gap-1"><FileText className="size-3.5" />{blogTypeLabel(submission.type)}</span><span>{formatDate(submission.createdAt)}</span></>,
                    href: `/admin/blog-submissions/${submission._id}`,
                }))}
            />
        </main>
    );
}

function BlogSubmissionsLoading() {
    return <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6"><div className="h-9 w-64 animate-pulse rounded bg-muted" /><div className="mt-8 h-40 animate-pulse rounded bg-muted" /></main>;
}

function blogTypeLabel(type: "tip" | "article" | "joke") {
    return {tip: "Porada", article: "Artykuł", joke: "Ciekawostka"}[type];
}

function formatDate(timestamp: number) {
    return new Intl.DateTimeFormat("pl-PL", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(timestamp);
}
