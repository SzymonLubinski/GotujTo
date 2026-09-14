"use client";

import {type MouseEvent, useEffect, useRef, useState} from "react";
import {useRouter} from "next/navigation";
import {usePaginatedQuery, useQuery} from "convex/react";
import {api} from "@gotujto/convex/_generated/api";
import {stores, type StoresT} from "@gotujto/shared/data/stableData";
import ShortItem from "@/components/web/short/ShortItem";
import DealsShortsHeader from "@/components/web/feed/DealsShortsHeader";
import StoresSheet from "@/components/web/feed/StoresSheet";
import {useShortFeed} from "@/lib/hooks/useShortFeed";

const INITIAL_SHORTS_COUNT = 3;
const LOAD_MORE_COUNT = 3;
const STORES_STORAGE_KEY = "gotujto:selected-stores";
const FEED_RETURN_KEY = "gotujto:feed-return";

type FeedSession = {
    randomSeed: string;
    createdBefore: number;
};

type FeedReturnState = FeedSession & {
    recipeId: string;
    loadedRecipesCount: number;
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

        const parsed = JSON.parse(saved) as Partial<FeedReturnState>;

        if (
            typeof parsed.recipeId !== "string" ||
            typeof parsed.randomSeed !== "string" ||
            typeof parsed.createdBefore !== "number" ||
            typeof parsed.loadedRecipesCount !== "number" ||
            !Array.isArray(parsed.selectedStores)
        ) {
            return null;
        }

        return {
            recipeId: parsed.recipeId,
            randomSeed: parsed.randomSeed,
            createdBefore: parsed.createdBefore,
            loadedRecipesCount: Math.max(parsed.loadedRecipesCount, INITIAL_SHORTS_COUNT),
            selectedStores: parsed.selectedStores,
        };
    } catch {
        return null;
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

    const initializedRef = useRef(false);
    const recipeToRestoreRef = useRef<string | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const loadTriggerRef = useRef<HTMLElement>(null);

    useEffect(() => {
        if (initializedRef.current) {
            return;
        }

        initializedRef.current = true;

        const returnState = readFeedReturnState();

        sessionStorage.removeItem(FEED_RETURN_KEY);

        if (returnState) {
            recipeToRestoreRef.current = returnState.recipeId;
            setSelectedStores(returnState.selectedStores);
            setInitialRecipesCount(returnState.loadedRecipesCount);
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
        feedSession && dealsEnabled ? {stores: selectedStores, limit: 10} : "skip",
    );

    const priorityRecipesReady = !dealsEnabled || priorityRecipesQuery !== undefined;
    const priorityRecipes = dealsEnabled ? priorityRecipesQuery ?? [] : [];
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

    const allRecipes = [...priorityRecipes, ...results];

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

        if (!recipeId || !container || !priorityRecipesReady || status === "LoadingFirstPage") {
            return;
        }

        const recipeIndex = allRecipes.findIndex(item => item.recipe._id === recipeId);

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
    }, [allRecipes.length, priorityRecipesReady, status]);

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

        const returnState: FeedReturnState = {
            recipeId,
            randomSeed: feedSession.randomSeed,
            createdBefore: feedSession.createdBefore,
            loadedRecipesCount: Math.max(results.length, INITIAL_SHORTS_COUNT),
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
            <DealsShortsHeader onStoresClick={() => setStoresOpen(true)} />

            <StoresSheet
                open={storesOpen}
                onOpenChange={setStoresOpen}
                selectedStores={selectedStores}
                onSelectedStoresChange={setSelectedStores}
            />

            <div
                ref={scrollContainerRef}
                onClickCapture={handleRecipeClick}
                className="no-scrollbar h-full snap-y snap-mandatory overflow-y-scroll overscroll-y-contain bg-black [overflow-anchor:none]"
            >
                {allRecipes.map((item, index) => (
                    <ShortItem
                        key={item.recipe._id}
                        item={item}
                        index={index}
                        isActive={index === activeShortIndex}
                        isNearby={Math.abs(index - activeShortIndex) <= 1}
                        isMuted={isMuted}
                        isLastLoaded={index === allRecipes.length - 1}
                        loadTriggerRef={loadTriggerRef}
                        onMutedChange={setIsMuted}
                    />
                ))}
            </div>
        </>
    );
}