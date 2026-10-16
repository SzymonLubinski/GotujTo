"use client";

import Link from "next/link";
import {type FormEvent, type ReactNode, useState} from "react";
import {LoaderCircle, MessageCircle, Send} from "lucide-react";
import {toast} from "sonner";
import {useMutation, useQuery, useConvexAuth} from "convex/react";

import {api} from "@gotujto/convex/_generated/api";
import type {Id} from "@gotujto/convex/_generated/dataModel";
import {Button} from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import {Textarea} from "@/components/ui/textarea";
import {ReportCommentButton} from "@/components/web/comments/ReportCommentButton";
import {getUserFacingErrorMessage} from "@/lib/user-facing-error";

type RecipeCommentsProps = {
    recipeId: Id<"recipes">;
};

type RecipeCommentsSheetProps = RecipeCommentsProps & {
    recipeName: string;
    children: ReactNode;
};

function formatCommentDate(createdAt: number) {
    return new Intl.DateTimeFormat("pl-PL", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(new Date(createdAt));
}

function RecipeCommentsContent({recipeId}: RecipeCommentsProps) {
    const comments = useQuery(api.userDashboard.getRecipeComments, {recipeId});
    const createComment = useMutation(api.userDashboard.addRecipeComment);
    const {isAuthenticated, isLoading} = useConvexAuth();
    const [content, setContent] = useState("");
    const [isPending, setIsPending] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const normalizedContent = content.trim();

        if (!normalizedContent) {
            return;
        }

        setIsPending(true);

        try {
            await createComment({
                recipeId,
                content: normalizedContent,
            });
            setContent("");
        } catch (error) {
            toast.error(getUserFacingErrorMessage(error, "Nie udało się dodać komentarza. Spróbuj ponownie."));
        } finally {
            setIsPending(false);
        }
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            {comments === undefined ? (
                <div className="flex min-h-36 items-center justify-center">
                    <LoaderCircle aria-label="Ladowanie komentarzy" className="size-5 animate-spin text-lime-300" />
                </div>
            ) : comments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-sm leading-6 text-white/60">
                    Nie ma jeszcze komentarzy. Napisz pierwszy.
                </div>
            ) : (
                <ul className="max-h-80 space-y-4 overflow-y-auto pr-1">
                    {comments.map(comment => (
                        <li key={comment._id} className="flex gap-3">
                            <div aria-hidden className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-lime-400/15 text-sm font-semibold text-lime-200">
                                {comment.authorAvatarUrl ? (
                                    <img src={comment.authorAvatarUrl} alt="" className="size-full rounded-full object-cover" />
                                ) : comment.authorName.slice(0, 1).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                    <p className="font-medium text-white">{comment.authorName}</p>
                                    <time className="text-xs text-white/45" dateTime={new Date(comment.createdAt).toISOString()}>{formatCommentDate(comment.createdAt)}</time>
                                    <div className="ml-auto">
                                        <ReportCommentButton targetType="recipe" commentId={comment._id} isOwn={comment.isOwn} />
                                    </div>
                                </div>
                                <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-white/80">{comment.content}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            <div className="mt-5 border-t border-white/10 pt-4">
                {isLoading ? (
                    <div className="flex h-11 items-center justify-center"><LoaderCircle className="size-4 animate-spin text-lime-300" /></div>
                ) : !isAuthenticated ? (
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/70">
                        Aby dodac komentarz, <Link href="/login" className="font-semibold text-lime-300 hover:text-lime-200">zaloguj sie</Link>.
                    </div>
                ) : (
                    <form className="space-y-3" onSubmit={handleSubmit}>
                        <Textarea
                            value={content}
                            onChange={event => setContent(event.target.value)}
                            placeholder="Napisz komentarz..."
                            maxLength={1_000}
                            required
                            className="min-h-24 resize-none border-white/15 bg-white/5 text-white placeholder:text-white/40"
                        />
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-xs text-white/45">{content.length}/1000</span>
                            <Button type="submit" disabled={isPending || !content.trim()} className="bg-lime-400 text-black hover:bg-lime-300">
                                {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
                                Dodaj komentarz
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

export function RecipeCommentsSection({recipeId}: RecipeCommentsProps) {
    return (
        <section aria-labelledby="recipe-comments-heading">
            <div className="mb-5 flex items-center gap-2">
                <MessageCircle className="size-5 text-lime-300" />
                <h2 id="recipe-comments-heading" className="text-xl font-bold tracking-tight">Komentarze</h2>
            </div>
            <RecipeCommentsContent recipeId={recipeId} />
        </section>
    );
}

export function RecipeCommentsSheet({recipeId, recipeName, children}: RecipeCommentsSheetProps) {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>{children}</SheetTrigger>
            <SheetContent side="bottom" className="mx-auto flex max-h-[85dvh] w-full max-w-md flex-col rounded-t-3xl border-white/10 bg-zinc-950 px-0 text-white" showCloseButton={false}>
                <div aria-hidden className="mx-auto mt-2 h-1 w-10 rounded-full bg-white/30" />
                <SheetHeader className="px-6 pb-4 pt-5 text-left">
                    <SheetTitle className="text-xl text-white">Komentarze</SheetTitle>
                    <SheetDescription className="line-clamp-1 text-white/60">{recipeName}</SheetDescription>
                </SheetHeader>
                {open && <div className="min-h-0 overflow-y-auto px-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]"><RecipeCommentsContent recipeId={recipeId} /></div>}
            </SheetContent>
        </Sheet>
    );
}
