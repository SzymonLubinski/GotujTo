"use client";

import {type MouseEvent, useRef, useState, useEffect} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import {usePaginatedQuery, useQuery} from "convex/react";
import {api} from "@gotujto/convex/_generated/api";
import {type Id} from "@gotujto/convex/_generated/dataModel";
import FridgeShortsHeader from "@/components/web/feed/FridgeShortsHeader";
import FridgeShortsSkeleton from "@/components/web/feed/FridgeShortsSkeleton";
import ShortItem from "@/components/web/short/ShortItem";
import {useShortFeed} from "@/lib/hooks/useShortFeed";

const INITIAL_SHORTS_COUNT = 3;
const LOAD_MORE_COUNT = 3;
const FRIDGE_RESULTS_RETURN_KEY = "gotujto:fridge-results-return";

type FeedSession = {
    randomSeed: string;
    createdBefore: number;
};

type FridgeResultsReturnState = FeedSession & {
    recipeId: string;
    loadedRecipesCount: number;
};

function createFeedSession(): FeedSession {
    return {
        randomSeed: crypto.randomUUID(),
        createdBefore: Date.now(),
    };
}

function readFridgeResultsReturnState(): FridgeResultsReturnState | null {
    try {
        const saved = sessionStorage.getItem(FRIDGE_RESULTS_RETURN_KEY);

        if (!saved) {
            return null;
        }

        const parsed = JSON.parse(saved) as Partial<FridgeResultsReturnState>;

        if (
            typeof parsed.recipeId !== "string" ||
            typeof parsed.randomSeed !== "string" ||
            typeof parsed.createdBefore !== "number" ||
            typeof parsed.loadedRecipesCount !== "number"
        ) {
            return null;
        }

        return {
            recipeId: parsed.recipeId,
            randomSeed: parsed.randomSeed,
            createdBefore: parsed.createdBefore,
            loadedRecipesCount: Math.max(
                parsed.loadedRecipesCount,
                INITIAL_SHORTS_COUNT,
            ),
        };
    } catch {
        return null;
    }
}

export default function FridgeResultsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isMuted, setIsMuted] = useState(true);
    const [limit, setLimit] = useState(INITIAL_SHORTS_COUNT);
    const [initialRecipesCount, setInitialRecipesCount] = useState(INITIAL_SHORTS_COUNT);
    const [feedSession, setFeedSession] = useState<FeedSession | null>(null);
    const initializedRef = useRef(false);
    const recipeToRestoreRef = useRef<string | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const loadTriggerRef = useRef<HTMLElement>(null);

    const productIds = [
        ...new Set(
            searchParams
                .getAll("productId")
                .flatMap(value => value.split(","))
                .map(value => value.trim())
                .filter(Boolean),
        ),
    ] as Id<"products">[];

    const priorityRecipesQuery = useQuery(
        api.recipes.getRecipesByProducts,
        productIds.length > 0
            ? {productIds, limit: 30}
            : "skip",
    );

    const priorityRecipes = priorityRecipesQuery ?? [];

    const uniqueRecipesIds = priorityRecipes.map(
        item => item.recipe._id,
    );

    useEffect(() => {
        if (initializedRef.current) {
            return;
        }

        initializedRef.current = true;

        const returnState = readFridgeResultsReturnState();

        sessionStorage.removeItem(FRIDGE_RESULTS_RETURN_KEY);

        if (returnState) {
            recipeToRestoreRef.current = returnState.recipeId;
            setInitialRecipesCount(returnState.loadedRecipesCount);
            setFeedSession({
                randomSeed: returnState.randomSeed,
                createdBefore: returnState.createdBefore,
            });
            return;
        }

        setFeedSession(createFeedSession());
    }, []);

    const {
        results,
        status,
        loadMore,
    } = usePaginatedQuery(
        api.recipes.getRecipesPaginated,
        productIds.length > 0 && feedSession && priorityRecipesQuery !== undefined
            ? {
                excludedRecipeIds:
                uniqueRecipesIds,
                randomSeed:
                feedSession.randomSeed,
                createdBefore:
                feedSession.createdBefore,
            }
            : "skip",
        {
            initialNumItems: initialRecipesCount,
        },
    );

    const allRecipes = [
        ...priorityRecipes,
        ...results,
    ];
    const isInitialLoading =
        !feedSession ||
        priorityRecipesQuery === undefined ||
        status === "LoadingFirstPage";

    const {activeShortIndex} = useShortFeed({
        resultsLength: allRecipes.length,
        limit,
        setLimit,
        scrollContainerRef,
        loadTriggerRef,
        loadMoreCount: LOAD_MORE_COUNT,
        loadMore,
        canLoadMore: status === "CanLoadMore",
    });

    useEffect(() => {
        const recipeId = recipeToRestoreRef.current;
        const container = scrollContainerRef.current;

        if (
            !recipeId ||
            !container ||
            priorityRecipesQuery === undefined ||
            status === "LoadingFirstPage"
        ) {
            return;
        }

        const recipeIndex = allRecipes.findIndex(
            item => item.recipe._id === recipeId,
        );

        if (recipeIndex === -1) {
            return;
        }

        recipeToRestoreRef.current = null;

        const restorePosition = () => {
            container.scrollTop = recipeIndex * container.clientHeight;
        };

        restorePosition();

        const animationFrame = requestAnimationFrame(restorePosition);
        const timeout = window.setTimeout(restorePosition, 200);

        return () => {
            cancelAnimationFrame(animationFrame);
            window.clearTimeout(timeout);
        };
    }, [allRecipes.length, priorityRecipesQuery, status]);

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

        if (url.origin !== window.location.origin || !recipeId) {
            return;
        }

        const returnState: FridgeResultsReturnState = {
            recipeId,
            randomSeed: feedSession.randomSeed,
            createdBefore: feedSession.createdBefore,
            loadedRecipesCount: Math.max(results.length, INITIAL_SHORTS_COUNT),
        };

        sessionStorage.setItem(
            FRIDGE_RESULTS_RETURN_KEY,
            JSON.stringify(returnState),
        );
        sessionStorage.setItem(
            "gotujto:recipe-return-url",
            `${window.location.pathname}${window.location.search}`,
        );
        event.preventDefault();
        router.push(`${url.pathname}${url.search}${url.hash}`, {scroll: false});
    }

    if (productIds.length === 0) {
        return (
            <>
                <div aria-hidden className="feed-desktop-background" />

                <div className="relative z-10 flex h-dvh items-center justify-center bg-black px-6 text-center text-white lg:bg-transparent">
                    Nie wybrano produktów.
                </div>
            </>
        );
    }

    return (
        <>
            <div aria-hidden className="feed-desktop-background" />

            <div className="relative z-10 h-dvh overflow-hidden">
                <FridgeShortsHeader resultsCount={priorityRecipes.length} />

                {isInitialLoading ? (
                    <FridgeShortsSkeleton />
                ) : (
                    <div
                        ref={scrollContainerRef}
                        onClickCapture={handleRecipeClick}
                        className="no-scrollbar h-full snap-y snap-mandatory overflow-y-scroll overscroll-y-contain [overflow-anchor:none]"
                    >
                        {allRecipes.map((item, index) => (
                            <ShortItem
                                key={item.recipe._id}
                                item={item}
                                index={index}
                                isActive={index === activeShortIndex}
                                isNearby={
                                    Math.abs(index - activeShortIndex) <= 1
                                }
                                isMuted={isMuted}
                                isLastLoaded={
                                    index === allRecipes.length - 1
                                }
                                loadTriggerRef={loadTriggerRef}
                                onMutedChange={setIsMuted}
                            />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
