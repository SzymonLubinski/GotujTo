"use client";

import {useRef, useState} from "react";
import {usePaginatedQuery, useQuery} from "convex/react";
import {api} from "@gotujto/convex/_generated/api";
import type {ShortItemData} from "@gotujto/shared/types/result-type";
import type {StoresT} from "@gotujto/shared/data/stableData";
import ShortItem from "@/components/web/short/ShortItem";
import AdShortItem from "@/components/web/short/AdShortItem";
import DealsShortsHeader from "@/components/web/feed/DealsShortsHeader";
import StoresSheet from "@/components/web/feed/StoresSheet";
import {useShortFeed} from "@/lib/hooks/useShortFeed";

const INITIAL_SHORTS_COUNT = 3;
const LOAD_MORE_COUNT = 3;
const AD_INTERVAL = 5;

type FeedItem =
    | {
    type: "recipe";
    id: string;
    data: ShortItemData;
}
    | {
    type: "ad";
    id: string;
};

export default function FeedPage() {
    const [isMuted, setIsMuted] = useState(true);
    const [storesOpen, setStoresOpen] = useState(false);
    const [selectedStores, setSelectedStores] = useState<StoresT[]>([]);
    const [limit, setLimit] = useState(INITIAL_SHORTS_COUNT);

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const loadTriggerRef = useRef<HTMLElement>(null);

    const priorityRecipesQuery = useQuery(
        api.recipes.getRecipesByDeals,
        {
            stores: selectedStores,
            limit: 10,
        },
    );

    const priorityRecipes = priorityRecipesQuery ?? [];
    const excludedRecipeIds = priorityRecipes.map(
        item => item.recipe._id,
    );

    const {results, status, loadMore} = usePaginatedQuery(
        api.recipes.getRecipesPaginated,
        priorityRecipesQuery !== undefined
            ? {excludedRecipeIds}
            : "skip",
        {initialNumItems: INITIAL_SHORTS_COUNT},
    );

    const allRecipes = [...priorityRecipes, ...results];
    const feedItems: FeedItem[] = [];

    allRecipes.forEach((item, recipeIndex) => {
        feedItems.push({
            type: "recipe",
            id: `recipe-${item.recipe._id}`,
            data: item,
        });

        if ((recipeIndex + 1) % AD_INTERVAL === 0) {
            feedItems.push({
                type: "ad",
                id: `ad-after-${item.recipe._id}`,
            });
        }
    });

    const {activeShortIndex} = useShortFeed({
        resultsLength: feedItems.length,
        limit,
        setLimit,
        scrollContainerRef,
        loadTriggerRef,
        loadMoreCount: LOAD_MORE_COUNT,
        loadMore,
        canLoadMore: status === "CanLoadMore",
    });

    const lastRecipeId = allRecipes[allRecipes.length - 1]?.recipe._id;

    return (
        <>
            <DealsShortsHeader
                onStoresClick={() => setStoresOpen(true)}
            />

            <StoresSheet
                open={storesOpen}
                onOpenChange={setStoresOpen}
                selectedStores={selectedStores}
                onSelectedStoresChange={setSelectedStores}
            />

            <div
                ref={scrollContainerRef}
                className="no-scrollbar h-full snap-y snap-mandatory overflow-y-scroll overscroll-y-contain bg-black [overflow-anchor:none]"
            >
                {feedItems.map((item, index) => {
                    const isNearby =
                        Math.abs(index - activeShortIndex) <= 1;

                    if (item.type === "ad") {
                        return (
                            <AdShortItem
                                key={item.id}
                                index={index}
                                isNearby={isNearby}
                            />
                        );
                    }

                    return (
                        <ShortItem
                            key={item.id}
                            item={item.data}
                            index={index}
                            isActive={index === activeShortIndex}
                            isNearby={isNearby}
                            isMuted={isMuted}
                            isLastLoaded={
                                item.data.recipe._id === lastRecipeId
                            }
                            loadTriggerRef={loadTriggerRef}
                            onMutedChange={setIsMuted}
                        />
                    );
                })}
            </div>
        </>
    );
}