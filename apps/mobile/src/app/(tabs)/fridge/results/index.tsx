import {useLocalSearchParams} from "expo-router";
import {type Id} from "@gotujto/convex/_generated/dataModel";
import RecipeShorts from "@/components/Shorts/RecipeShorts";
import {usePaginatedQuery, useQuery} from "convex/react";
import {api} from "@gotujto/convex/_generated/api";
import {useState} from "react";
import {View} from "react-native";
import FridgeResultsHeader from "@/components/Nav/FridgeResultsHeader";
import {ShortsFeedItem} from "@gotujto/shared/types/result-type";

export default function FridgeResultsScreen() {
    const [standardStarted, setStandardStarted] = useState(false);
    const {productId} = useLocalSearchParams<{
        productId?: string | string[];
    }>();
    const productIds = (
        Array.isArray(productId)
            ? productId.flatMap(value => value.split(","))
            : productId
                ? productId.split(",")
                : []
    )
        .map(value => value.trim())
        .filter(value => value.length > 0) as Id<"products">[];

    const uniqueProductIds = [...new Set(productIds)];
    const fridgeRecipes = useQuery(
        api.recipes.getRecipesByProducts, {
            productIds: uniqueProductIds,
        }) ?? [];
    const excludedRecipeIds = fridgeRecipes.map(item => item.recipe._id)
    const {
        results: standardRecipes,
        status: standardStatus,
        loadMore,
    } = usePaginatedQuery(
        api.recipes.getRecipesPaginated,
        standardStarted ? {excludedRecipeIds} : "skip",
        {initialNumItems: 2},
    );

    const recipes = [...fridgeRecipes, ...standardRecipes];
    const feedItems: ShortsFeedItem[] = recipes.map(
        item => ({
            type: "recipe",
            id: `recipe-${item.recipe._id}`,
            data: item,
        }),
    );

    const handleApproachingEnd = () => {
        if (!standardStarted) {
            setStandardStarted(true);
            return;
        }
        if (standardStatus === "CanLoadMore") {
            loadMore(2);
        }
    };

    return (
        <View className="flex-1 bg-black">
            <RecipeShorts items={feedItems}
                          onApproachingEnd={handleApproachingEnd}
                          productIds={uniqueProductIds}
            />

            <FridgeResultsHeader resultsCount={fridgeRecipes.length}/>
        </View>
    );
}