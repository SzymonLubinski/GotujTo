import Link from "next/link";
import {notFound} from "next/navigation";
import {fetchQuery} from "convex/nextjs";
import {ArrowLeft, FileText, Images, Video} from "lucide-react";

import {api} from "@gotujto/convex/_generated/api";
import {type Id} from "@gotujto/convex/_generated/dataModel";
import {BlogSubmissionActions} from "@/components/web/admin/BlogSubmissionActions";
import {Button} from "@/components/ui/button";
import {getAdminSecret} from "@/lib/auth/getAdminSecret";
import {requireAdminRequest} from "@/lib/auth/requireAdminRequest";

type BlogSubmissionDetailPageProps = {
    params: Promise<{
        submissionId: string;
    }>;
};

export default async function BlogSubmissionDetailPage({params}: BlogSubmissionDetailPageProps) {
    await requireAdminRequest();

    const {submissionId} = await params;
    const submission = await fetchQuery(api.userDashboard.getBlogSubmissionForAdmin, {
        adminSecret: getAdminSecret(),
        submissionId: submissionId as Id<"blogSubmissions">,
    });

    if (!submission) {
        notFound();
    }

    return (
        <main className="mx-auto w-full max-w-4xl space-y-8 px-4 py-8 sm:px-6">
            <header className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <Button asChild variant="ghost" className="-ml-3 mb-3"><Link href="/admin/blog-submissions"><ArrowLeft className="size-4" />Wroc do zgloszen</Link></Button>
                    <p className="text-sm text-muted-foreground">Autor: {submission.authorName}</p>
                    <h1 className="mt-1 text-3xl font-bold tracking-tight">{submission.title}</h1>
                    <p className="mt-2 inline-flex items-center gap-2 text-sm text-muted-foreground"><FileText className="size-4" />{blogTypeLabel(submission.type)} · {formatDate(submission.createdAt)}</p>
                </div>
            </header>

            <article className="rounded-2xl border bg-card p-5">
                <h2 className="text-lg font-semibold">Tresc wpisu</h2>
                <p className="mt-4 whitespace-pre-wrap leading-7 text-muted-foreground">{submission.description}</p>
            </article>

            {submission.videoUrl && <section>
                <h2 className="flex items-center gap-2 text-lg font-semibold"><Video className="size-5" />Film</h2>
                <video src={submission.videoUrl} controls playsInline preload="metadata" className="mt-4 aspect-video w-full rounded-xl border bg-black">Twoja przegladarka nie obsluguje odtwarzania wideo.</video>
            </section>}

            {submission.images.length > 0 && <section>
                <h2 className="flex items-center gap-2 text-lg font-semibold"><Images className="size-5" />Zdjecia</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {submission.images.map((imageUrl, index) => <img key={imageUrl} src={imageUrl} alt={`Zdjecie ${index + 1} we wpisie ${submission.title}`} className="aspect-video w-full rounded-xl border object-cover" />)}
                </div>
            </section>}

            {submission.adminNote && <section className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-4"><h2 className="font-semibold">Notatka administratora</h2><p className="mt-2 text-sm text-muted-foreground">{submission.adminNote}</p></section>}

            <BlogSubmissionActions submissionId={submission._id} status={submission.status} />
        </main>
    );
}

function blogTypeLabel(type: "tip" | "article" | "joke") {
    return {tip: "Porada", article: "Artykul", joke: "Ciekawostka"}[type];
}

function formatDate(timestamp: number) {
    return new Intl.DateTimeFormat("pl-PL", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(timestamp);
}
