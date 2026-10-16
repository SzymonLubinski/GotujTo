"use client";

import Link from "next/link";
import {useState, type FormEvent} from "react";
import {BookOpenText, LoaderCircle, Plus, Send, Trash2} from "lucide-react";
import {useMutation, useQuery} from "convex/react";

import {api} from "@gotujto/convex/_generated/api";
import type {Id} from "@gotujto/convex/_generated/dataModel";
import type {RecipeImageValue, RecipeVideoValue} from "@/lib/schemas/recipe";
import {uploadImages} from "@/lib/cloud/uploadImages";
import {uploadVideo} from "@/lib/cloud/uploadVideo";
import {MediaUploadFields} from "@/components/web/media/MediaUploadFields";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Textarea} from "@/components/ui/textarea";
import {deleteBlogSubmissionAction} from "@/app/actions";

type BlogType = "tip" | "article" | "joke";

const blogTypes: {value: BlogType; label: string}[] = [
    {value: "article", label: "Artykul"},
    {value: "tip", label: "Porada"},
    {value: "joke", label: "Ciekawostka"},
];

function getErrorMessage(error: unknown) {
    return error instanceof Error && error.message
        ? error.message
        : "Nie udalo sie wyslac wpisu. Sprobuj ponownie.";
}

function SubmissionStatus({status}: {status: "pending" | "approved" | "rejected"}) {
    const labels = {pending: "Oczekuje", approved: "Zatwierdzono", rejected: "Odrzucono"};
    const styles = {pending: "border-amber-300/30 bg-amber-300/10 text-amber-200", approved: "border-lime-300/30 bg-lime-300/10 text-lime-200", rejected: "border-red-300/30 bg-red-300/10 text-red-200"};

    return <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${styles[status]}`}>{labels[status]}</span>;
}

export function BlogSubmissionTab() {
    const submissions = useQuery(api.userDashboard.getBlogSubmissions);
    const createSubmission = useMutation(api.userDashboard.createBlogSubmission);
    const generateImageUploadUrl = useMutation(api.userDashboard.generateBlogSubmissionImageUploadUrl);
    const registerPendingSubmissionImage = useMutation(api.userDashboard.registerPendingSubmissionImage);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState<BlogType>("article");
    const [images, setImages] = useState<RecipeImageValue[]>([]);
    const [video, setVideo] = useState<RecipeVideoValue | undefined>();
    const [showForm, setShowForm] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<Id<"blogSubmissions"> | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            const imageIds = await uploadImages(
                images,
                generateImageUploadUrl,
                storageId => registerPendingSubmissionImage({storageId}),
            );
            const videoKey = video
                ? await uploadVideo(video.file, "/api/uploads/video?purpose=blog-submission")
                : undefined;

            await createSubmission({
                title,
                description,
                type,
                images: imageIds,
                videoKey,
            });

            setTitle("");
            setDescription("");
            setType("article");
            setImages([]);
            setVideo(undefined);
            setShowForm(false);
        } catch (caughtError) {
            setError(getErrorMessage(caughtError));
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleDelete(submissionId: Id<"blogSubmissions">) {
        setError(null);
        setDeletingId(submissionId);

        try {
            await deleteBlogSubmissionAction(submissionId);
        } catch (caughtError) {
            setError(getErrorMessage(caughtError));
        } finally {
            setDeletingId(null);
        }
    }

    return <section className="space-y-7">
        {showForm ? <Card className="border border-white/10 bg-zinc-950/90 text-white">
            <CardHeader>
                <div className="flex size-11 items-center justify-center rounded-full bg-lime-400/15 text-lime-300"><BookOpenText className="size-5" /></div>
                <CardTitle>Dodaj wpis blogowy</CardTitle>
                <CardDescription className="text-zinc-400">Wpis trafi najpierw do weryfikacji administratora. Nie bedzie widoczny publicznie przed zatwierdzeniem.</CardDescription>
            </CardHeader>
            <CardContent>
                <form className="space-y-5" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                        <Label htmlFor="blog-title">Tytul</Label>
                        <Input id="blog-title" value={title} onChange={event => setTitle(event.target.value)} maxLength={160} required className="border-white/15 bg-black/30 text-white" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="blog-type">Rodzaj wpisu</Label>
                        <select id="blog-type" value={type} onChange={event => setType(event.target.value as BlogType)} className="flex h-10 w-full rounded-lg border border-white/15 bg-black/30 px-3 text-sm text-white outline-none focus:border-lime-300">
                            {blogTypes.map(item => <option key={item.value} value={item.value} className="bg-zinc-950">{item.label}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="blog-description">Tresc</Label>
                        <Textarea id="blog-description" value={description} onChange={event => setDescription(event.target.value)} maxLength={20_000} required className="min-h-48 border-white/15 bg-black/30 text-white" />
                        <p className="text-right text-xs text-zinc-500">{description.length}/20 000</p>
                    </div>
                    <MediaUploadFields
                        contentLabel="wpisu"
                        idPrefix="blog"
                        maxImages={4}
                        images={images}
                        video={video}
                        onImagesChange={nextImages => setImages(nextImages as RecipeImageValue[])}
                        onVideoChange={nextVideo => setVideo(nextVideo as RecipeVideoValue | undefined)}
                    />
                    <Button type="submit" disabled={isSubmitting} className="w-full bg-lime-400 text-black hover:bg-lime-300">
                        {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
                        Wyslij do weryfikacji
                    </Button>
                </form>
            </CardContent>
        </Card> : <Card className="border border-lime-400/30 bg-lime-400/10 text-white"><CardContent className="space-y-4 py-5"><p className="font-semibold text-lime-100">Wpis zostal wyslany do weryfikacji.</p><Button type="button" className="bg-lime-400 text-black hover:bg-lime-300" onClick={() => setShowForm(true)}><Plus className="size-4" />Dodaj kolejny wpis</Button></CardContent></Card>}

        {error && <p role="alert" className="rounded-xl border border-red-400/30 bg-red-950/30 px-3 py-2 text-sm text-red-200">{error}</p>}

        <section>
            <h3 className="text-lg font-semibold">Twoje wpisy</h3>
            {submissions === undefined ? <div className="mt-4 flex min-h-28 items-center justify-center rounded-2xl border border-white/10 bg-zinc-950/90"><LoaderCircle className="size-5 animate-spin text-lime-300" /></div> : submissions.length === 0 ? <p className="mt-3 text-sm text-zinc-400">Nie wyslales jeszcze zadnego wpisu.</p> : <div className="mt-4 space-y-3">{submissions.map(submission => {
                const publishedBlogId = submission.status === "approved" ? submission.reviewedBlogId : undefined;
                const card = <article className={publishedBlogId ? "rounded-2xl border border-lime-300/30 bg-zinc-950/90 p-4 transition-colors hover:border-lime-300/60 hover:bg-zinc-900" : "rounded-2xl border border-white/10 bg-zinc-950/90 p-4"}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h4 className="truncate font-semibold text-white">{submission.title}</h4><p className="mt-1 text-sm text-zinc-400">{blogTypes.find(item => item.value === submission.type)?.label}</p></div><SubmissionStatus status={submission.status} /></div>{submission.adminNote && <p className="mt-3 rounded-lg bg-white/5 px-3 py-2 text-sm text-zinc-300">{submission.adminNote}</p>}{publishedBlogId && <p className="mt-3 text-sm font-medium text-lime-300">Zobacz opublikowany wpis →</p>}{submission.status === "pending" && <Button type="button" variant="ghost" size="sm" disabled={deletingId === submission._id} className="mt-3 text-red-300 hover:bg-red-400/10 hover:text-red-200" onClick={() => void handleDelete(submission._id)}>{deletingId === submission._id ? <LoaderCircle className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}Usun zgloszenie</Button>}</article>;

                return publishedBlogId ? <Link key={submission._id} href={`/blog/${publishedBlogId}`} className="block">{card}</Link> : <div key={submission._id}>{card}</div>;
            })}</div>}
        </section>
    </section>;
}
