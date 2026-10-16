import {notFound} from "next/navigation";
import Link from "next/link";
import {fetchQuery} from "convex/nextjs";
import {BookOpenText, CalendarDays, UserRound} from "lucide-react";

import {api} from "@gotujto/convex/_generated/api";
import {type Id} from "@gotujto/convex/_generated/dataModel";
import {BlogCommentsSection} from "@/components/web/blog/BlogComments";
import {FavoriteBlogButton} from "@/components/web/blog/FavoriteBlogButton";
import {RecipeHeader} from "@/components/web/recipe-card/RecipeHeader";
import {RecipeHeaderNavigation} from "@/components/web/recipe-card/RecipeHeaderNavigation";
import {ShareButton} from "@/components/web/ShareButton";

type BlogPageProps = {
    params: Promise<{
        blogId: Id<"blog">;
    }>;
};

const typeLabels = {
    tip: "Porada",
    article: "Artykuł",
    joke: "Ciekawostka",
};

export default async function BlogPage({params}: BlogPageProps) {
    const {blogId} = await params;
    const blog = await fetchQuery(api.blog.getBlogById, {blogId});

    if (!blog) {
        notFound();
    }

    const videoUrl = blog.videoUrl?.trim() || undefined;
    const hasMedia = Boolean(videoUrl) || blog.images.length > 0;

    return (
        <article className="min-h-dvh bg-black pb-16 text-white">
            <div className="relative mx-auto w-full max-w-3xl bg-zinc-950">
                <RecipeHeaderNavigation />
                {hasMedia ? <RecipeHeader title={blog.title} images={blog.images} videoUrl={videoUrl} /> : <div className="h-16" />}
            </div>

            <div className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8">
                <p className="inline-flex w-fit items-center gap-2 rounded-full bg-lime-400 px-3 py-1 text-sm font-semibold text-black"><BookOpenText className="size-4" />Blog · {typeLabels[blog.type]}</p>
                <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">{blog.title}</h1>
                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/75">
                    <p className="inline-flex items-center gap-2"><CalendarDays className="size-4" />{formatDate(blog.publishedAt)}</p>
                    <div className="inline-flex items-center gap-2"><UserRound className="size-4" />{blog.authorUserId ? <Link href={`/u/${blog.authorUserId}`} className="transition-colors hover:text-lime-300">{blog.authorName}</Link> : blog.authorName}</div>
                </div>
                <div className="mb-8 mt-8 flex items-center justify-between gap-4 border-b border-white/10 pb-6">
                    <p className="text-sm text-white/60">Zapisz wpis, aby łatwo wrócić do niego później.</p>
                    <div className="flex shrink-0 items-center gap-2">
                        <FavoriteBlogButton blogId={blog._id} />
                        <ShareButton
                            path={`/blog/${blog._id}`}
                            title={blog.title}
                            text={`Zobacz wpis: ${blog.title}`}
                        />
                    </div>
                </div>
                <div className="whitespace-pre-wrap text-base leading-8 text-zinc-200 sm:text-lg">{blog.description}</div>
                <div className="mt-12 border-t border-white/10 pt-10">
                    <BlogCommentsSection blogId={blog._id} />
                </div>
            </div>
        </article>
    );
}

function formatDate(timestamp: number) {
    return new Intl.DateTimeFormat("pl-PL", {
        dateStyle: "long",
    }).format(timestamp);
}
