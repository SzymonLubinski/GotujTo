"use client";

import Link from "next/link";
import {useEffect, useRef, useState} from "react";
import {ArrowRight, BookOpenText, CakeSlice, Clock} from "lucide-react";

import type {Id} from "@gotujto/convex/_generated/dataModel";
import {BlogShortActions} from "@/components/web/blog/BlogShortActions";
import {RecipeShortActions} from "@/components/web/short/RecipeShortActions";
import RecipeMediaCarousel from "@/components/web/short/RecipeMediaCarousel";

export type PublicProfileRecipe = {
    _id: Id<"recipes">;
    name: string;
    description: string;
    cookingMinutes: number;
    servings: number;
    images: string[];
    videoUrl?: string;
    favoriteCount: number;
    commentCount: number;
};

export type PublicProfileBlogPost = {
    _id: Id<"blog">;
    title: string;
    description: string;
    type: "tip" | "article" | "joke";
    images: string[];
    videoUrl?: string;
    favoriteCount: number;
    commentCount: number;
};

type PublicProfileFeedProps =
    | {type: "recipes"; items: PublicProfileRecipe[]}
    | {type: "blog"; items: PublicProfileBlogPost[]};

const blogTypeLabels = {
    tip: "Porada",
    article: "Artykul",
    joke: "Ciekawostka",
};

export function PublicProfileFeed({type, items}: PublicProfileFeedProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isMuted, setIsMuted] = useState(true);

    useEffect(() => {
        const container = scrollContainerRef.current;

        if (!container) return;

        const shorts = Array.from(container.querySelectorAll<HTMLElement>("[data-public-profile-short-index]"));
        const observer = new IntersectionObserver(entries => {
            const visibleShort = entries
                .filter(entry => entry.isIntersecting)
                .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];

            if (!visibleShort) return;

            const index = Number(visibleShort.target.getAttribute("data-public-profile-short-index"));

            if (Number.isSafeInteger(index)) setActiveIndex(index);
        }, {root: container, threshold: [0.5, 0.75]});

        shorts.forEach(short => observer.observe(short));

        return () => observer.disconnect();
    }, [items.length, type]);

    if (items.length === 0) {
        const label = type === "recipes" ? "przepisow" : "wpisow";

        return <p className="rounded-2xl border border-dashed border-white/15 px-5 py-8 text-sm text-white/60">Ten autor nie ma jeszcze opublikowanych {label}.</p>;
    }

    return (
        <div ref={scrollContainerRef} className="no-scrollbar h-[calc(100dvh-18rem)] min-h-[30rem] snap-y snap-mandatory overflow-y-auto overscroll-y-contain rounded-2xl border border-white/10 bg-zinc-950 [overflow-anchor:none]">
            {type === "recipes"
                ? items.map((recipe, index) => <PublicRecipeShort key={recipe._id} recipe={recipe} index={index} isActive={index === activeIndex} isNearby={Math.abs(index - activeIndex) <= 1} isMuted={isMuted} onMutedChange={setIsMuted} />)
                : items.map((blog, index) => <PublicBlogShort key={blog._id} blog={blog} index={index} isActive={index === activeIndex} isNearby={Math.abs(index - activeIndex) <= 1} isMuted={isMuted} onMutedChange={setIsMuted} />)}
        </div>
    );
}

function PublicRecipeShort({
    recipe,
    index,
    isActive,
    isNearby,
    isMuted,
    onMutedChange,
}: {
    recipe: PublicProfileRecipe;
    index: number;
    isActive: boolean;
    isNearby: boolean;
    isMuted: boolean;
    onMutedChange: (muted: boolean) => void;
}) {
    return (
        <article data-public-profile-short-index={index} className="relative h-full w-full shrink-0 snap-start snap-always overflow-hidden bg-black text-white">
            <ShortBackground image={recipe.images[0]} />
            <div className="absolute inset-0 z-10">
                <RecipeMediaCarousel
                    name={recipe.name}
                    images={recipe.images}
                    videoUrl={recipe.videoUrl}
                    isActive={isActive}
                    isNearby={isNearby}
                    isMuted={isMuted}
                    onMutedChange={onMutedChange}
                    priority={index === 0}
                />
            </div>
            <div className="absolute inset-0 bg-linear-to-t from-black via-black/65 to-black/10" />

            <div className="pointer-events-none absolute inset-0 z-30 flex flex-col justify-between p-6 pb-24 pt-8">
                <div className="inline-flex w-fit rounded-full bg-lime-400 px-3 py-1 text-sm font-semibold text-black">Przepis</div>
                <div className="max-w-sm">
                    <Link href={`/recipe/${recipe._id}`} className="pointer-events-auto inline-block">
                        <h2 className="text-3xl font-bold tracking-tight text-white">{recipe.name}</h2>
                    </Link>
                    {recipe.description && <p className="mt-3 line-clamp-3 whitespace-pre-line text-sm leading-6 text-white/85">{recipe.description}</p>}
                    <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/85">
                        <span className="inline-flex items-center gap-1.5"><Clock className="size-4" />{recipe.cookingMinutes} min</span>
                        <span className="inline-flex items-center gap-1.5"><CakeSlice className="size-4" />{recipe.servings} porcji</span>
                    </p>
                </div>
            </div>

            <RecipeShortActions
                recipeId={recipe._id}
                recipeName={recipe.name}
                favoriteCount={recipe.favoriteCount}
                commentCount={recipe.commentCount}
            />
        </article>
    );
}

function PublicBlogShort({
    blog,
    index,
    isActive,
    isNearby,
    isMuted,
    onMutedChange,
}: {
    blog: PublicProfileBlogPost;
    index: number;
    isActive: boolean;
    isNearby: boolean;
    isMuted: boolean;
    onMutedChange: (muted: boolean) => void;
}) {
    return (
        <article data-public-profile-short-index={index} className="relative h-full w-full shrink-0 snap-start snap-always overflow-hidden bg-black text-white">
            <ShortBackground image={blog.images[0]} />
            <div className="absolute inset-0 z-10">
                <RecipeMediaCarousel
                    name={blog.title}
                    images={blog.images}
                    videoUrl={blog.videoUrl}
                    isActive={isActive}
                    isNearby={isNearby}
                    isMuted={isMuted}
                    onMutedChange={onMutedChange}
                    priority={index === 0}
                />
            </div>
            <div className="absolute inset-0 bg-linear-to-t from-black via-black/65 to-black/10" />

            <div className="pointer-events-none absolute inset-0 z-30 flex flex-col justify-between p-6 pb-24 pt-8">
                <div className="inline-flex w-fit items-center gap-2 rounded-full bg-lime-400 px-3 py-1 text-sm font-semibold text-black">
                    <BookOpenText className="size-4" />
                    Blog - {blogTypeLabels[blog.type]}
                </div>
                <div className="max-w-sm">
                    <Link href={`/blog/${blog._id}`} className="pointer-events-auto inline-block">
                        <h2 className="text-3xl font-bold tracking-tight text-white">{blog.title}</h2>
                    </Link>
                    <p className="mt-3 line-clamp-5 whitespace-pre-line text-sm leading-6 text-white/85">{blog.description}</p>
                    <Link href={`/blog/${blog._id}`} className="pointer-events-auto mt-5 inline-flex items-center gap-2 rounded-full border border-white/30 bg-black/35 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-black/60">
                        Czytaj caly wpis
                        <ArrowRight className="size-4" />
                    </Link>
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

function ShortBackground({image}: {image?: string}) {
    if (!image) {
        return <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(163,230,53,0.24),_transparent_38%),linear-gradient(160deg,_#171717,_#030303_70%)]" />;
    }

    return (
        <>
            <img src={image} alt="" aria-hidden className="absolute inset-0 size-full scale-110 object-cover blur-2xl brightness-[0.35]" />
            <img src={image} alt="" aria-hidden className="absolute inset-0 size-full object-cover opacity-70" />
        </>
    );
}
