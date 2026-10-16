"use client";

import {MessageCircle, Share2} from "lucide-react";
import {toast} from "sonner";

import type {Id} from "@gotujto/convex/_generated/dataModel";
import {FavoriteBlogButton} from "@/components/web/blog/FavoriteBlogButton";
import {BlogCommentsSheet} from "@/components/web/blog/BlogComments";
import {Button} from "@/components/ui/button";

type BlogShortActionsProps = {
    blogId: Id<"blog">;
    blogTitle: string;
    favoriteCount: number;
    commentCount: number;
};

function formatCount(count: number) {
    return new Intl.NumberFormat("pl-PL", {
        notation: "compact",
        maximumFractionDigits: 1,
    }).format(count);
}

export function BlogShortActions({blogId, blogTitle, favoriteCount, commentCount}: BlogShortActionsProps) {
    async function shareBlog() {
        const url = `${window.location.origin}/blog/${blogId}`;

        try {
            if (navigator.share) {
                await navigator.share({
                    title: blogTitle,
                    text: `Zobacz wpis: ${blogTitle}`,
                    url,
                });
                return;
            }

            await navigator.clipboard.writeText(url);
            toast.success("Link do wpisu został skopiowany.");
        } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") {
                return;
            }

            toast.error("Nie udało się udostępnić wpisu.");
        }
    }

    return (
        <aside aria-label="Akcje wpisu" className="pointer-events-auto absolute right-3 top-1/2 z-40 flex -translate-y-1/2 flex-col items-center gap-4 text-white">
            <div className="flex flex-col items-center gap-0.5">
                <FavoriteBlogButton blogId={blogId} appearance="short" />
                <span className="text-xs font-medium text-white/90">{formatCount(favoriteCount)}</span>
            </div>

            <BlogCommentsSheet blogId={blogId} blogTitle={blogTitle}>
                <div className="flex flex-col items-center gap-0.5">
                    <Button type="button" variant="ghost" size="icon" aria-label="Otwórz komentarze" className="size-8 rounded-full bg-transparent text-white shadow-none hover:bg-white/10 hover:text-white">
                        <MessageCircle className="size-5.5 stroke-[2.5] drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]" />
                    </Button>
                    <span className="text-xs font-medium text-white/90">{formatCount(commentCount)}</span>
                </div>
            </BlogCommentsSheet>

            <Button type="button" variant="ghost" size="icon" aria-label="Udostępnij wpis" className="size-8 rounded-full bg-transparent text-white shadow-none hover:bg-white/10 hover:text-white" onClick={shareBlog}>
                <Share2 className="size-5.5 stroke-[2.5] drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]" />
            </Button>
        </aside>
    );
}
