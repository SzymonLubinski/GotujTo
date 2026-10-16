import Link from "next/link";
import {notFound} from "next/navigation";
import {fetchQuery} from "convex/nextjs";
import {ArrowLeft, Clock, Users, Video} from "lucide-react";
import {Suspense} from "react";

import {api} from "@gotujto/convex/_generated/api";
import {type Id} from "@gotujto/convex/_generated/dataModel";
import {RecipeSubmissionActions} from "@/components/web/admin/RecipeSubmissionActions";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {getAdminSecret} from "@/lib/auth/getAdminSecret";
import {requireAdminRequest} from "@/lib/auth/requireAdminRequest";

type RecipeSubmissionDetailsPageProps = {
    params: Promise<{
        submissionId: string;
    }>;
};

export default function RecipeSubmissionDetailsPage(props: RecipeSubmissionDetailsPageProps) {
    return <Suspense fallback={<RecipeSubmissionDetailsLoading />}><RecipeSubmissionDetailsContent {...props} /></Suspense>;
}

async function RecipeSubmissionDetailsContent({params}: RecipeSubmissionDetailsPageProps) {
    await requireAdminRequest();

    const {submissionId} = await params;
    const submission = await fetchQuery(api.userDashboard.getRecipeSubmissionForAdmin, {
        adminSecret: getAdminSecret(),
        submissionId: submissionId as Id<"recipeSubmissions">,
    });

    if (!submission) notFound();

    return (
        <main className="mx-auto w-full max-w-4xl space-y-8 px-4 py-8 sm:px-6">
            <header className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <Button asChild variant="ghost" className="-ml-3 mb-3"><Link href="/admin/recipe-submissions"><ArrowLeft className="size-4" />Wroc do zgloszen</Link></Button>
                    <p className="text-sm text-muted-foreground">Autor: {submission.authorName}</p>
                    <h1 className="mt-1 text-3xl font-bold tracking-tight">{submission.recipe.name}</h1>
                    <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground"><span className="inline-flex items-center gap-1"><Clock className="size-4" />{submission.recipe.cookingMinutes} min</span><span className="inline-flex items-center gap-1"><Users className="size-4" />{submission.recipe.servings} porcji</span></p>
                </div>
                <StatusBadge status={submission.status} />
            </header>

            {submission.recipe.videoUrl && <section>
                <h2 className="flex items-center gap-2 text-lg font-semibold"><Video className="size-5" />Film</h2>
                <video src={submission.recipe.videoUrl} controls playsInline preload="metadata" className="mt-4 aspect-video w-full rounded-xl border bg-black">Twoja przegladarka nie obsluguje odtwarzania wideo.</video>
            </section>}

            {submission.recipe.images.length > 0 && <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {submission.recipe.images.map((image, index) => <div key={image.storageId} className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted"><img src={image.url} alt={`${submission.recipe.name} - zdjecie ${index + 1}`} className="h-full w-full object-cover" /></div>)}
            </section>}

            <Card>
                <CardHeader>
                    <CardTitle>Opis i oznaczenia</CardTitle>
                    <CardDescription>{submission.recipe.description || "Autor nie dodal opisu."}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                    {[...submission.recipe.diets, ...submission.recipe.types, ...submission.recipe.occasions].length === 0 ? <span className="text-sm text-muted-foreground">Brak oznaczen.</span> : [...submission.recipe.diets, ...submission.recipe.types, ...submission.recipe.occasions].map((tag, index) => <span key={`${tag}-${index}`} className="rounded-full bg-muted px-3 py-1 text-xs font-medium">{tag}</span>)}
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Skladniki</CardTitle><CardDescription>{submission.recipe.ingredientGroups.length} grup skladnikow</CardDescription></CardHeader>
                <CardContent>
                    <ol className="space-y-4">
                        {submission.recipe.ingredientGroups.map((group, index) => <li key={index} className="rounded-xl border p-4"><IngredientLine ingredient={group.main} /><div className="mt-3 space-y-2 border-l-2 border-muted pl-4">{group.substitutes.length === 0 ? <p className="text-sm text-muted-foreground">Brak zamiennikow.</p> : group.substitutes.map((substitute, substituteIndex) => <IngredientLine key={substituteIndex} ingredient={substitute} substitute />)}</div></li>)}
                    </ol>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Przygotowanie</CardTitle></CardHeader>
                <CardContent>
                    <ol className="space-y-4">{submission.recipe.steps.map((step, index) => <li key={index} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3"><span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{index + 1}</span><p className="pt-1 leading-7">{step.description}</p></li>)}</ol>
                </CardContent>
            </Card>

            {submission.adminNote && <Card><CardHeader><CardTitle>Notatka administratora</CardTitle><CardDescription>{submission.adminNote}</CardDescription></CardHeader></Card>}
            <RecipeSubmissionActions submissionId={submission._id} status={submission.status} />
        </main>
    );
}

function RecipeSubmissionDetailsLoading() {
    return <main className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8 sm:px-6"><div className="h-9 w-72 animate-pulse rounded bg-muted" /><div className="aspect-[4/5] max-w-md animate-pulse rounded-2xl bg-muted" /></main>;
}

function IngredientLine({ingredient, substitute = false}: {ingredient: {productName: string; metricQuantity: number; metricUnit: string; customaryQuantity: number; customaryUnit: string; optional: boolean}; substitute?: boolean}) {
    return <p className="text-sm"><span className="font-semibold">{substitute ? "Zamiennik: " : ""}{ingredient.productName}</span><span className="text-muted-foreground"> — {ingredient.metricQuantity} {ingredient.metricUnit} / {ingredient.customaryQuantity} {ingredient.customaryUnit}{ingredient.optional ? ", opcjonalnie" : ""}</span></p>;
}

function StatusBadge({status}: {status: "pending" | "approved" | "rejected"}) {
    const labels = {pending: "Oczekuje", approved: "Zatwierdzone", rejected: "Odrzucone"};
    const styles = {pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300", approved: "bg-lime-500/15 text-lime-700 dark:text-lime-300", rejected: "bg-red-500/15 text-red-700 dark:text-red-300"};

    return <span className={`rounded-full px-3 py-1 text-sm font-medium ${styles[status]}`}>{labels[status]}</span>;
}
