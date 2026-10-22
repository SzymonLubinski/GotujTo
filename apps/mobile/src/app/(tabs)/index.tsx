import {useCallback, useEffect, useMemo, useState} from "react";
import {ActivityIndicator, View} from "react-native";
import {usePaginatedQuery, useQuery} from "convex/react";
import {api} from "@gotujto/convex/_generated/api";
import {type ShortsFeedItem} from "@gotujto/shared/types/result-type";
import RecipeShorts from "@/components/Shorts/RecipeShorts";
import HomeHeader from "@/components/Nav/HomeHeader";
import {useSelectedStores} from "@/providers/SelectedStoresContext";

const RECIPES_PAGE_SIZE = 3;
const INITIAL_BLOG_SHORTS_COUNT = 6;
const LOAD_MORE_BLOGS_COUNT = 3;

type FeedSession = {
    randomSeed: string;
    createdBefore: number;
};

function getSeededScore(seed: string, value: string) {
    const input = `${seed}:${value}`;
    let hash = 2166136261;

    for (let index = 0; index < input.length; index += 1) {
        hash ^= input.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }

    return hash >>> 0;
}

function orderBySessionSeed<T>(items: T[], seed: string, getId: (item: T) => string) {
    return [...items].sort((first, second) => {
        const firstScore = getSeededScore(seed, getId(first));
        const secondScore = getSeededScore(seed, getId(second));

        return firstScore - secondScore || getId(first).localeCompare(getId(second));
    });
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

export default function Index() {
    const {selectedStores, setSelectedStores} = useSelectedStores();
    const [feedSession] = useState<FeedSession>(() => ({
        randomSeed: `${Date.now()}-${Math.random()}`,
        createdBefore: Date.now(),
    }));
    const dealsEnabled = selectedStores.length > 0;

    const dealRecipesQuery = useQuery(
        api.recipes.getRecipesByDeals,
        dealsEnabled
            ? {
                stores: selectedStores,
                limit: 30,
                asOf: feedSession.createdBefore,
            }
            : "skip",
    );

    const priorityRecipesReady = !dealsEnabled || dealRecipesQuery !== undefined;

    const priorityRecipes = useMemo(
        () => orderBySessionSeed(
            dealsEnabled ? dealRecipesQuery ?? [] : [],
            feedSession.randomSeed,
            item => item.recipe._id,
        ),
        [dealRecipesQuery, dealsEnabled, feedSession.randomSeed],
    );

    const excludedRecipeIds = useMemo(
        () =>
            priorityRecipes.map(
                item => item.recipe._id,
            ),
        [priorityRecipes],
    );

    const {
        results: standardRecipes,
        status: standardStatus,
        loadMore: loadMoreRecipes,
    } = usePaginatedQuery(
        api.recipes.getRecipesPaginated,
        priorityRecipesReady
            ? {
                excludedRecipeIds,
                ...feedSession,
            }
            : "skip",
        {
            initialNumItems: RECIPES_PAGE_SIZE,
        },
    );

    const {
        results: blogContent,
        status: blogStatus,
        loadMore: loadMoreBlog,
    } = usePaginatedQuery(
        api.blog.getBlogShortsPaginated,
        feedSession,
        {
            initialNumItems: INITIAL_BLOG_SHORTS_COUNT,
        },
    );

    const recipes = useMemo(
        () => [
            ...priorityRecipes,
            ...standardRecipes,
        ],
        [
            priorityRecipes,
            standardRecipes,
        ],
    );

    const {feedItems, blockedByBlog} = useMemo(() => {
        const items: ShortsFeedItem[] = [];
        let recipeIndex = 0;
        let blogIndex = 0;
        let blogSlot = 0;
        let isBlockedByBlog = false;

        while (recipeIndex < recipes.length) {
            const recipesInBlock = getRecipeGapBeforeBlog(
                feedSession.randomSeed,
                blogSlot,
            );
            const blockStart = recipeIndex;
            const blockEnd = Math.min(recipeIndex + recipesInBlock, recipes.length);

            while (recipeIndex < blockEnd) {
                const recipe = recipes[recipeIndex];

                items.push({
                    type: "recipe",
                    id: `recipe-${recipe.recipe._id}`,
                    data: recipe,
                });
                recipeIndex += 1;
            }

            if (recipeIndex - blockStart < recipesInBlock) {
                break;
            }

            const blogItem = blogContent[blogIndex];

            if (blogItem) {
                items.push({
                    type: "blog",
                    id: `blog-${blogItem._id}`,
                    data: blogItem,
                });
                blogIndex += 1;
                blogSlot += 1;
                continue;
            }

            if (blogStatus !== "Exhausted") {
                isBlockedByBlog = true;
                break;
            }

            blogSlot += 1;
        }

        return {
            feedItems: items,
            blockedByBlog: isBlockedByBlog,
        };
    }, [blogContent, blogStatus, feedSession.randomSeed, recipes]);

    const requiredBlogCount = getRequiredBlogCount(
        recipes.length + RECIPES_PAGE_SIZE,
        feedSession.randomSeed,
    );

    useEffect(() => {
        if (blogStatus !== "CanLoadMore" || blogContent.length >= requiredBlogCount) {
            return;
        }

        loadMoreBlog(
            Math.max(
                LOAD_MORE_BLOGS_COUNT,
                requiredBlogCount - blogContent.length,
            ),
        );
    }, [blogContent.length, blogStatus, loadMoreBlog, requiredBlogCount]);

    const handleApproachingEnd = useCallback(() => {
        if (blockedByBlog || standardStatus !== "CanLoadMore") {
            return;
        }

        loadMoreRecipes(RECIPES_PAGE_SIZE);
    }, [blockedByBlog, loadMoreRecipes, standardStatus]);

    if (!priorityRecipesReady) {
        return (
            <View className="flex-1 bg-black">
                <HomeHeader
                    selectedStores={
                        selectedStores
                    }
                    onSelectedStoresChange={
                        setSelectedStores
                    }
                />

                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator
                        size="large"
                        color="#a3e635"
                    />
                </View>
            </View>
        );
    }

    return (
        <View className="flex-1">
            <HomeHeader
                selectedStores={selectedStores}
                onSelectedStoresChange={
                    setSelectedStores
                }
            />

            <RecipeShorts
                key={`${selectedStores.join("|")}:${feedSession.randomSeed}`}
                items={feedItems}
                onApproachingEnd={
                    handleApproachingEnd
                }
            />
        </View>
    );
}
