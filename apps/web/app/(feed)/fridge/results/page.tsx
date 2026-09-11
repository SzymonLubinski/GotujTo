"use client";

import {useRef, useState} from "react";
import {useSearchParams} from "next/navigation";
import {usePaginatedQuery, useQuery} from "convex/react";
import {api} from "@gotujto/convex/_generated/api";
import {type Id} from "@gotujto/convex/_generated/dataModel";
import FridgeShortsHeader from "@/components/web/feed/FridgeShortsHeader";
import ShortItem from "@/components/web/short/ShortItem";
import {useShortFeed} from "@/lib/hooks/useShortFeed";

const INITIAL_SHORTS_COUNT = 3;
const LOAD_MORE_COUNT = 3;

export default function FridgeResultsPage() {
    const searchParams = useSearchParams();
    const [isMuted, setIsMuted] = useState(true);
    const [limit, setLimit] = useState(INITIAL_SHORTS_COUNT);
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

    const priorityRecipes = useQuery(
        api.recipes.getRecipesByProducts,
        productIds.length > 0
            ? {productIds}
            : "skip",
    ) ?? [];

    const uniqueRecipesIds = priorityRecipes.map(
        item => item.recipe._id,
    );

    const {
        results,
        loadMore,
    } = usePaginatedQuery(
        api.recipes.getRecipesPaginated,
        productIds.length > 0
            ? {excludedRecipeIds: uniqueRecipesIds}
            : "skip",
        {
            initialNumItems: INITIAL_SHORTS_COUNT,
        },
    );

    const allRecipes = [
        ...priorityRecipes,
        ...results,
    ];

    const {activeShortIndex} = useShortFeed({
        resultsLength: allRecipes.length,
        limit,
        setLimit,
        scrollContainerRef,
        loadTriggerRef,
        loadMoreCount: LOAD_MORE_COUNT,
        loadMore,
    });

    if (productIds.length === 0) {
        return (
            <div className="flex h-dvh items-center justify-center bg-black px-6 text-center text-white">
                Nie wybrano produktów.
            </div>
        );
    }

    return (
        <div className="h-dvh overflow-hidden bg-black">
            <FridgeShortsHeader resultsCount={priorityRecipes.length} />

            <div
                ref={scrollContainerRef}
                className="no-scrollbar h-full snap-y snap-mandatory overflow-y-scroll overscroll-y-contain bg-black [overflow-anchor:none]"
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
        </div>
    );
}