import type {RefObject} from "react";
import Link from "next/link";
import {ArrowRight, BookOpenText, UserRound} from "lucide-react";
import type {FunctionReturnType} from "convex/server";

import type {api} from "@gotujto/convex/_generated/api";
import {BlogShortActions} from "@/components/web/blog/BlogShortActions";
import RecipeMediaCarousel from "@/components/web/short/RecipeMediaCarousel";

type BlogShort = FunctionReturnType<
    typeof api.blog.getBlogShortsPaginated
>["page"][number];

type BlogShortItemProps = {
    blog: BlogShort;
    index: number;
    isActive: boolean;
    isNearby: boolean;
    isMuted: boolean;
    isLastLoaded: boolean;
    loadTriggerRef: RefObject<HTMLElement | null>;
    onMutedChange: (muted: boolean) => void;
};

const typeLabels = {
    tip: "Porada",
    article: "Artykuł",
    joke: "Ciekawostka",
};

export default function BlogShortItem({blog, index, isActive, isNearby, isMuted, isLastLoaded, loadTriggerRef, onMutedChange}: BlogShortItemProps) {
    return (
        <article ref={isLastLoaded ? loadTriggerRef : undefined} data-short-index={index} className="relative mx-auto h-full w-full max-w-md snap-start snap-always overflow-hidden bg-zinc-950 text-white">
            <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(249,115,22,0.2),transparent_42%),linear-gradient(160deg,#27272a_0%,#09090b_52%,#020202_100%)]" />
            <div className="absolute inset-0 z-10"><RecipeMediaCarousel name={blog.title} images={blog.images} videoUrl={blog.videoUrl} isActive={isActive} isNearby={isNearby} isMuted={isMuted} onMutedChange={onMutedChange} priority={index === 0} /></div>
            <div className="pointer-events-none absolute inset-0 z-20 bg-linear-to-t from-black via-black/60 to-black/10" />

            <div className="pointer-events-none absolute inset-0 z-30 flex flex-col justify-between p-6 pb-[calc(env(safe-area-inset-bottom)+5rem)] pt-24">
                <div className="inline-flex w-fit items-center gap-2 rounded-full bg-lime-400 px-3 py-1 text-sm font-semibold text-black">
                    <BookOpenText className="size-4" />
                    Blog · {typeLabels[blog.type]}
                </div>

                <div className="max-w-sm">
                    <Link href={`/blog/${blog._id}`} className="pointer-events-auto inline-block">
                        <h2 className="text-2xl font-bold tracking-tight text-white">{blog.title}</h2>
                    </Link>
                    <p className="mt-3 line-clamp-6 whitespace-pre-line text-base leading-7 text-white/85">{blog.excerpt}</p>
                    <Link href={`/blog/${blog._id}`} className="pointer-events-auto mt-5 inline-flex items-center gap-2 rounded-full border border-white/30 bg-black/35 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-black/60">
                        Czytaj cały wpis
                        <ArrowRight className="size-4" />
                    </Link>
                    <div className="mt-4 flex items-center gap-2 text-sm text-white/80">
                        <UserRound className="size-4" />
                        {blog.authorUserId ? <Link href={`/u/${blog.authorUserId}`} className="pointer-events-auto transition-colors hover:text-lime-300">{blog.authorName}</Link> : blog.authorName}
                    </div>
                </div>
            </div>

            <BlogShortActions
                blogId={blog._id}
                blogTitle={blog.title}
                favoriteCount={blog.favoriteCount}
                commentCount={blog.commentCount}
            />
        </article>
    );
}
