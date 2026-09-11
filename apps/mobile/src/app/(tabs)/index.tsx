import {useCallback, useMemo, useState} from "react";
import {ActivityIndicator, View} from "react-native";
import {usePaginatedQuery, useQuery} from "convex/react";
import {api} from "@gotujto/convex/_generated/api";
import {stores, type StoresT} from "@gotujto/shared/data/stableData";
import {type ShortsFeedItem} from "@gotujto/shared/types/result-type";
import RecipeShorts from "@/components/Shorts/RecipeShorts";
import HomeHeader from "@/components/Nav/HomeHeader";

const BLOG_INTERVAL = 5;
const SOCIAL_POSITION = 8;
const RECIPES_PAGE_SIZE = 2;
const TEST_AD_POSITION = 3;

export default function Index() {
    const [selectedStores, setSelectedStores] =
        useState<StoresT[]>([...stores]);

    const dealRecipesQuery = useQuery(
        api.recipes.getRecipesByDeals,
        {
            stores: selectedStores,
            limit: 10,
        },
    );

    const dealsLoading =
        dealRecipesQuery === undefined;

    const dealRecipes =
        dealRecipesQuery ?? [];

    const excludedRecipeIds = useMemo(
        () =>
            dealRecipes.map(
                item => item.recipe._id,
            ),
        [dealRecipes],
    );

    const {
        results: standardRecipes,
        status: standardStatus,
        loadMore: loadMoreRecipes,
    } = usePaginatedQuery(
        api.recipes.getRecipesPaginated,
        !dealsLoading
            ? {excludedRecipeIds}
            : "skip",
        {
            initialNumItems: RECIPES_PAGE_SIZE,
        },
    );

    const socialContent =
        useQuery(
            api.social.getSocialContent,
        ) ?? [];

    const {
        results: blogContent,
        status: blogStatus,
        loadMore: loadMoreBlog,
    } = usePaginatedQuery(
        api.blog.getBlogContentPaginated,
        {},
        {
            initialNumItems: 2,
        },
    );

    const recipes = useMemo(
        () => [
            ...dealRecipes,
            ...standardRecipes,
        ],
        [
            dealRecipes,
            standardRecipes,
        ],
    );

    const feedItems = useMemo<ShortsFeedItem[]>(() => {
            const items: ShortsFeedItem[] = [];
            let blogIndex = 0;

            recipes.forEach(
                (recipe, recipeIndex) => {
                    items.push({
                        type: "recipe",
                        id: `recipe-${recipe.recipe._id}`,
                        data: recipe,
                    });

                    const shouldInsertBlog =
                        (recipeIndex + 1) %
                        BLOG_INTERVAL ===
                        0;

                    const blogItem =
                        blogContent[blogIndex];

                    if (
                        shouldInsertBlog &&
                        blogItem !== undefined
                    ) {
                        items.push({
                            type: "blog",
                            id: `blog-${blogItem._id}`,
                            blogType: blogItem.type,
                            title: blogItem.title,
                            description:
                            blogItem.description,
                            images: blogItem.images,
                            videoKey:
                            blogItem.videoKey,
                        });

                        blogIndex += 1;
                    }
                },
            );

            const socialItem =
                socialContent[0];

            if (
                socialItem !== undefined &&
                items.length >= SOCIAL_POSITION
            ) {
                items.splice(
                    SOCIAL_POSITION,
                    0,
                    {
                        type: "social",
                        id: `social-${socialItem._id}`,
                        title: socialItem.title,
                        description:
                        socialItem.description,
                        instagramUrl:
                        socialItem.instagramUrl,
                        facebookUrl:
                        socialItem.facebookUrl,
                    },
                );
            }

            if (items.length >= TEST_AD_POSITION) {
                items.splice(
                    TEST_AD_POSITION,
                    0,
                    {
                        type: "ad",
                        id: "ad-test-1",
                        slot: 1,
                    },
                );
            }

            return items;
        }, [
            recipes,
            blogContent,
            socialContent,
        ]);

    const handleApproachingEnd =
        useCallback(() => {
            if (
                standardStatus !== "CanLoadMore"
            ) {
                return;
            }

            const nextRecipeCount =
                recipes.length +
                RECIPES_PAGE_SIZE;

            const requiredBlogCount =
                Math.floor(
                    nextRecipeCount /
                    BLOG_INTERVAL,
                );

            loadMoreRecipes(
                RECIPES_PAGE_SIZE,
            );

            if (
                blogStatus === "CanLoadMore" &&
                blogContent.length <
                requiredBlogCount
            ) {
                loadMoreBlog(
                    requiredBlogCount -
                    blogContent.length,
                );
            }
        }, [
            standardStatus,
            blogStatus,
            recipes.length,
            blogContent.length,
            loadMoreRecipes,
            loadMoreBlog,
        ]);

    if (dealsLoading) {
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
                        color="#f97316"
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
                key={selectedStores.join("|")}
                items={feedItems}
                onApproachingEnd={
                    handleApproachingEnd
                }
            />
        </View>
    );
}