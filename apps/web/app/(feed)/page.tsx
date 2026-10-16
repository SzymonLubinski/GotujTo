"use client";

import {type MouseEvent, useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useRouter} from "next/navigation";
import {usePaginatedQuery, useQuery} from "convex/react";
import type {FunctionReturnType} from "convex/server";
import {api} from "@gotujto/convex/_generated/api";
import {stores, type StoresT} from "@gotujto/shared/data/stableData";
import type {ShortItemData} from "@gotujto/shared/types/result-type";
import ShortItem from "@/components/web/short/ShortItem";
import BlogShortItem from "@/components/web/short/BlogShortItem";
import DealsShortsHeader from "@/components/web/feed/DealsShortsHeader";
import StoresSheet from "@/components/web/feed/StoresSheet";
import FridgeShortsSkeleton from "@/components/web/feed/FridgeShortsSkeleton";
import {useShortFeed} from "@/lib/hooks/useShortFeed";
import {orderBySessionSeed} from "@/lib/utils";

const INITIAL_SHORTS_COUNT = 3;
const LOAD_MORE_COUNT = 3;
const INITIAL_BLOG_SHORTS_COUNT = 6;
const LOAD_MORE_BLOGS_COUNT = 3;
const STORES_STORAGE_KEY = "gotujto:selected-stores";
const FEED_RETURN_KEY = "gotujto:feed-return";
const RECIPE_RETURNING_KEY = "gotujto:recipe-returning";

type FeedSession = {
    randomSeed: string;
    createdBefore: number;
};

type BlogShortData = FunctionReturnType<
    typeof api.blog.getBlogShortsPaginated
>["page"][number];

type FeedItem =
    | {type: "recipe"; id: string; data: ShortItemData}
    | {type: "blog"; id: string; data: BlogShortData};

type FeedReturnState = FeedSession & {
    shortId: string;
    shortType: FeedItem["type"];
    loadedRecipesCount: number;
    loadedBlogsCount: number;
    selectedStores: StoresT[];
};

function createFeedSession(): FeedSession {
    return {
        randomSeed: crypto.randomUUID(),
        createdBefore: Date.now(),
    };
}

function readStoredStores(): StoresT[] {
    try {
        const saved = sessionStorage.getItem(STORES_STORAGE_KEY);

        if (saved === null) {
            return [...stores];
        }

        const parsed = JSON.parse(saved);

        if (!Array.isArray(parsed)) {
            return [...stores];
        }

        return parsed.filter((value): value is StoresT => stores.includes(value));
    } catch {
        return [...stores];
    }
}

function readFeedReturnState(): FeedReturnState | null {
    try {
        const saved = sessionStorage.getItem(FEED_RETURN_KEY);

        if (!saved) {
            return null;
        }

        const parsed = JSON.parse(saved) as Partial<FeedReturnState> & {
            recipeId?: unknown;
        };
        const shortId = typeof parsed.shortId === "string"
            ? parsed.shortId
            : typeof parsed.recipeId === "string"
                ? parsed.recipeId
                : null;

        if (
            shortId === null ||
            typeof parsed.randomSeed !== "string" ||
            typeof parsed.createdBefore !== "number" ||
            typeof parsed.loadedRecipesCount !== "number" ||
            !Array.isArray(parsed.selectedStores)
        ) {
            return null;
        }

        return {
            shortId,
            shortType: parsed.shortType === "blog" ? "blog" : "recipe",
            randomSeed: parsed.randomSeed,
            createdBefore: parsed.createdBefore,
            loadedRecipesCount: Math.max(parsed.loadedRecipesCount, INITIAL_SHORTS_COUNT),
            loadedBlogsCount: typeof parsed.loadedBlogsCount === "number"
                ? Math.max(parsed.loadedBlogsCount, INITIAL_BLOG_SHORTS_COUNT)
                : INITIAL_BLOG_SHORTS_COUNT,
            selectedStores: parsed.selectedStores,
        };
    } catch {
        return null;
    }
}

function getSeededScore(seed: string, value: string) {
    const input = `${seed}:${value}`;
    let hash = 2166136261;

    for (let index = 0; index < input.length; index++) {
        hash ^= input.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }

    return hash >>> 0;
}

function getRecipeGapBeforeBlog(seed: string, blogSlot: number) {
    return 6 + (getSeededScore(seed, `blog-gap:${blogSlot}`) % 3);
}

function getRequiredBlogCount(recipeCount: number, seed: string) {
    let recipesBeforeNextBlog = 0;
    let blogCount = 0;

    while (recipesBeforeNextBlog + getRecipeGapBeforeBlog(seed, blogCount) <= recipeCount) {
        recipesBeforeNextBlog += getRecipeGapBeforeBlog(seed, blogCount);
        blogCount += 1;
    }

    return blogCount;
}

function createFeedItems(recipes: ShortItemData[], blogs: BlogShortData[], seed: string, isBlogStreamExhausted: boolean) {
    const items: FeedItem[] = [];
    let recipeIndex = 0;
    let blogIndex = 0;
    let blogSlot = 0;
    let blockedByBlog = false;

    while (recipeIndex < recipes.length) {
        const recipeGap = getRecipeGapBeforeBlog(seed, blogSlot);
        const blockStart = recipeIndex;
        const blockEnd = Math.min(recipeIndex + recipeGap, recipes.length);

        while (recipeIndex < blockEnd) {
            const recipe = recipes[recipeIndex];

            if (!recipe) break;

            items.push({
                type: "recipe",
                id: recipe.recipe._id,
                data: recipe,
            });
            recipeIndex += 1;
        }

        if (recipeIndex - blockStart < recipeGap) {
            break;
        }

        const blog = blogs[blogIndex];

        if (blog) {
            items.push({
                type: "blog",
                id: blog._id,
                data: blog,
            });
            blogIndex += 1;
            blogSlot += 1;
            continue;
        }

        if (!isBlogStreamExhausted) {
            blockedByBlog = true;
            break;
        }

        blogSlot += 1;
    }

    return {items, blockedByBlog};
}

function didReturnFromRecipe() {
    try {
        const didReturn = sessionStorage.getItem(RECIPE_RETURNING_KEY) === "true";
        sessionStorage.removeItem(RECIPE_RETURNING_KEY);

        return didReturn;
    } catch {
        return false;
    }
}

export default function FeedPage() {
    const router = useRouter();
    const [isMuted, setIsMuted] = useState(true);
    const [storesOpen, setStoresOpen] = useState(false);
    const [selectedStores, setSelectedStores] = useState<StoresT[]>([]);
    const [limit, setLimit] = useState(INITIAL_SHORTS_COUNT);
    const [feedSession, setFeedSession] = useState<FeedSession | null>(null);
    const [initialRecipesCount, setInitialRecipesCount] = useState(INITIAL_SHORTS_COUNT);
    const [initialBlogsCount, setInitialBlogsCount] = useState(INITIAL_BLOG_SHORTS_COUNT);

    const initializedRef = useRef(false);
    const shortToRestoreRef = useRef<{id: string; type: FeedItem["type"]} | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const loadTriggerRef = useRef<HTMLElement>(null);

    useEffect(() => {
        if (initializedRef.current) {
            return;
        }

        initializedRef.current = true;

        const returnState = didReturnFromRecipe()
            ? readFeedReturnState()
            : null;

        sessionStorage.removeItem(FEED_RETURN_KEY);

        if (returnState) {
            shortToRestoreRef.current = {
                id: returnState.shortId,
                type: returnState.shortType,
            };
            setSelectedStores(returnState.selectedStores);
            setInitialRecipesCount(returnState.loadedRecipesCount);
            setInitialBlogsCount(returnState.loadedBlogsCount);
            setFeedSession({
                randomSeed: returnState.randomSeed,
                createdBefore: returnState.createdBefore,
            });
            return;
        }

        setSelectedStores(readStoredStores());
        setFeedSession(createFeedSession());
    }, []);

    useEffect(() => {
        if (!feedSession) {
            return;
        }

        sessionStorage.setItem(STORES_STORAGE_KEY, JSON.stringify(selectedStores));
    }, [feedSession, selectedStores]);

    const dealsEnabled = selectedStores.length > 0;

    const priorityRecipesQuery = useQuery(
        api.recipes.getRecipesByDeals,
        feedSession && dealsEnabled
            ? {
                stores: selectedStores,
                limit: 30,
                asOf: feedSession.createdBefore,
            }
            : "skip",
    );

    const priorityRecipesReady = !dealsEnabled || priorityRecipesQuery !== undefined;
    const priorityRecipes = useMemo(
        () => orderBySessionSeed(
            dealsEnabled ? priorityRecipesQuery ?? [] : [],
            feedSession?.randomSeed,
            item => item.recipe._id,
        ),
        [dealsEnabled, feedSession?.randomSeed, priorityRecipesQuery],
    );
    const excludedRecipeIds = priorityRecipes.map(item => item.recipe._id);

    const {results, status, loadMore} = usePaginatedQuery(
        api.recipes.getRecipesPaginated,
        feedSession && priorityRecipesReady
            ? {
                excludedRecipeIds,
                randomSeed: feedSession.randomSeed,
                createdBefore: feedSession.createdBefore,
            }
            : "skip",
        {initialNumItems: initialRecipesCount},
    );

    const {results: blogResults, status: blogStatus, loadMore: loadMoreBlogs} = usePaginatedQuery(
        api.blog.getBlogShortsPaginated,
        feedSession
            ? {
                randomSeed: feedSession.randomSeed,
                createdBefore: feedSession.createdBefore,
            }
            : "skip",
        {initialNumItems: initialBlogsCount},
    );

    const recipeItems = [...priorityRecipes, ...results];
    const {items: feedItems, blockedByBlog} = useMemo(
        () => createFeedItems(
            recipeItems,
            blogResults,
            feedSession?.randomSeed ?? "",
            blogStatus === "Exhausted",
        ),
        [blogResults, blogStatus, feedSession?.randomSeed, recipeItems],
    );
    const isInitialLoading =
        !feedSession ||
        !priorityRecipesReady ||
        status === "LoadingFirstPage" ||
        blogStatus === "LoadingFirstPage";

    const requiredBlogCount = useMemo(
        () => feedSession
            ? getRequiredBlogCount(recipeItems.length + LOAD_MORE_COUNT, feedSession.randomSeed)
            : 0,
        [feedSession, recipeItems.length],
    );

    useEffect(() => {
        if (
            blogResults.length >= requiredBlogCount ||
            blogStatus !== "CanLoadMore"
        ) {
            return;
        }

        loadMoreBlogs(Math.max(
            LOAD_MORE_BLOGS_COUNT,
            requiredBlogCount - blogResults.length,
        ));
    }, [blogResults.length, blogStatus, loadMoreBlogs, requiredBlogCount]);

    const handleLoadMore = useCallback((count: number) => {
        loadMore(count);
    }, [loadMore]);

    const {activeShortIndex} = useShortFeed({
        resultsLength: feedItems.length,
        limit,
        setLimit,
        scrollContainerRef,
        loadTriggerRef,
        loadMoreCount: LOAD_MORE_COUNT,
        loadMore: handleLoadMore,
        canLoadMore: status === "CanLoadMore" && !blockedByBlog,
    });

    useEffect(() => {
        const shortToRestore = shortToRestoreRef.current;
        const container = scrollContainerRef.current;

        if (!shortToRestore || !container || !priorityRecipesReady || status === "LoadingFirstPage" || blogStatus === "LoadingFirstPage") {
            return;
        }

        const shortIndex = feedItems.findIndex(item =>
            item.type === shortToRestore.type && item.id === shortToRestore.id,
        );

        if (shortIndex === -1) {
            return;
        }

        shortToRestoreRef.current = null;

        const restorePosition = () => {
            container.scrollTop = shortIndex * container.clientHeight;
        };

        restorePosition();

        const animationFrame = requestAnimationFrame(restorePosition);
        const timeout = window.setTimeout(restorePosition, 200);

        return () => {
            cancelAnimationFrame(animationFrame);
            window.clearTimeout(timeout);
        };
    }, [blogStatus, feedItems, priorityRecipesReady, status]);

    function handleRecipeClick(event: MouseEvent<HTMLDivElement>) {
        if (
            !feedSession ||
            !(event.target instanceof Element) ||
            event.button !== 0 ||
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey ||
            event.altKey
        ) {
            return;
        }

        const link = event.target.closest<HTMLAnchorElement>("a[href]");

        if (!link || link.target === "_blank") {
            return;
        }

        const url = new URL(link.href, window.location.href);
        const recipeId = url.pathname.match(/^\/recipe\/([^/]+)/)?.[1];
        const blogId = url.pathname.match(/^\/blog\/([^/]+)/)?.[1];
        const shortType: FeedItem["type"] | null = recipeId
            ? "recipe"
            : blogId
                ? "blog"
                : null;
        const shortId = recipeId ?? blogId;

        if (url.origin !== window.location.origin || !shortType || !shortId) {
            return;
        }

        const returnState: FeedReturnState = {
            shortId,
            shortType,
            randomSeed: feedSession.randomSeed,
            createdBefore: feedSession.createdBefore,
            loadedRecipesCount: Math.max(results.length, INITIAL_SHORTS_COUNT),
            loadedBlogsCount: Math.max(blogResults.length, INITIAL_BLOG_SHORTS_COUNT),
            selectedStores,
        };

        sessionStorage.setItem(FEED_RETURN_KEY, JSON.stringify(returnState));
        sessionStorage.setItem(
            "gotujto:recipe-return-url",
            `${window.location.pathname}${window.location.search}`,
        );
        event.preventDefault();
        router.push(`${url.pathname}${url.search}${url.hash}`, {scroll: false});
    }

    return (
        <>
            <div aria-hidden className="feed-desktop-background" />

            <DealsShortsHeader onStoresClick={() => setStoresOpen(true)} />

            <StoresSheet
                open={storesOpen}
                onOpenChange={setStoresOpen}
                selectedStores={selectedStores}
                onSelectedStoresChange={setSelectedStores}
            />

            {isInitialLoading ? (
                <FridgeShortsSkeleton />
            ) : (
                <div
                    ref={scrollContainerRef}
                    onClickCapture={handleRecipeClick}
                    className="relative z-10 no-scrollbar h-full snap-y snap-mandatory overflow-y-scroll overscroll-y-contain [overflow-anchor:none]"
                >
                    {feedItems.map((item, index) => item.type === "recipe" ? (
                        <ShortItem
                            key={`recipe:${item.id}`}
                            item={item.data}
                            index={index}
                            isActive={index === activeShortIndex}
                            isNearby={Math.abs(index - activeShortIndex) <= 1}
                            isMuted={isMuted}
                            isLastLoaded={index === feedItems.length - 1}
                            loadTriggerRef={loadTriggerRef}
                            onMutedChange={setIsMuted}
                        />
                    ) : (
                        <BlogShortItem
                            key={`blog:${item.id}`}
                            blog={item.data}
                            index={index}
                            isActive={index === activeShortIndex}
                            isNearby={Math.abs(index - activeShortIndex) <= 1}
                            isMuted={isMuted}
                            isLastLoaded={index === feedItems.length - 1}
                            loadTriggerRef={loadTriggerRef}
                            onMutedChange={setIsMuted}
                        />
                    ))}
                </div>
            )}
        </>
    );
}
