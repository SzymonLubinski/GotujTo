import Link from "next/link";
import {fetchQuery} from "convex/nextjs";
import {Flag, MessageCircleWarning} from "lucide-react";

import {api} from "@gotujto/convex/_generated/api";
import {CommentReportActions} from "@/components/web/admin/CommentReportActions";
import {Card, CardContent} from "@/components/ui/card";
import {getAdminSecret} from "@/lib/auth/getAdminSecret";
import {requireAdminRequest} from "@/lib/auth/requireAdminRequest";

export default async function CommentReportsPage() {
    await requireAdminRequest();

    const reports = await fetchQuery(api.userDashboard.getCommentReportsForAdmin, {
        adminSecret: getAdminSecret(),
        limit: 100,
    });

    return (
        <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
            <header className="mb-8">
                <p className="text-sm text-muted-foreground">Bezpieczenstwo spolecznosci</p>
                <h1 className="mt-1 text-3xl font-bold tracking-tight">Zgloszone komentarze</h1>
                <p className="mt-2 text-sm text-muted-foreground">Usun komentarz naruszajacy zasady albo oznacz zgloszenie jako przejrzane.</p>
            </header>

            {reports.length === 0 ? (
                <Card>
                    <CardContent className="flex min-h-48 flex-col items-center justify-center text-center">
                        <Flag className="size-6 text-lime-500" />
                        <h2 className="mt-3 font-semibold">Brak zgloszen</h2>
                        <p className="mt-1 text-sm text-muted-foreground">Wszystkie komentarze czekaja spokojnie na swoich miejscach.</p>
                    </CardContent>
                </Card>
            ) : (
                <ul className="space-y-4">
                    {reports.map(report => {
                        const href = report.targetType === "recipe"
                            ? `/recipe/${report.parentId}`
                            : `/blog/${report.parentId}`;
                        const label = report.targetType === "recipe" ? "Przepis" : "Blog";

                        return <li key={`${report.targetType}:${report.commentId}`}>
                            <Card>
                                <CardContent className="p-5">
                                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                                <MessageCircleWarning className="size-4 text-amber-500" />
                                                <span>{report.count} {report.count === 1 ? "zgloszenie" : "zgloszenia"}</span>
                                                <span>·</span>
                                                <span>{formatDate(report.latestReportedAt)}</span>
                                            </div>
                                            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6">{report.content}</p>
                                            <p className="mt-3 text-sm text-muted-foreground">Autor komentarza: {report.authorName}</p>
                                            <Link href={href} className="mt-2 inline-block max-w-full truncate text-sm font-medium text-lime-600 hover:underline dark:text-lime-400">
                                                {label}: {report.parentName}
                                            </Link>
                                        </div>
                                        <CommentReportActions targetType={report.targetType} commentId={report.commentId} />
                                    </div>
                                </CardContent>
                            </Card>
                        </li>;
                    })}
                </ul>
            )}
        </main>
    );
}

function formatDate(timestamp: number) {
    return new Intl.DateTimeFormat("pl-PL", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(timestamp);
}
