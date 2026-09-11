import {useMemo, useState} from "react";
import {ActivityIndicator, ScrollView, View} from "react-native";
import {useLocalSearchParams} from "expo-router";
import {useQuery} from "convex/react";
import {Clock, Tag, Users} from "lucide-react-native";
import {api} from "@gotujto/convex/_generated/api";
import {type Id} from "@gotujto/convex/_generated/dataModel";
import {useSelectedStores} from "@/providers/SelectedStoresContext";
import {Text} from "@/components/ui/text";
import RecipeHeader from "@/components/Recipe/RecipeHeader";
import RecipeIngredients from "@/components/Recipe/RecipeIngredients";
import RecipeSteps from "@/components/Recipe/RecipeSteps";
import UnitSystemToggle, {type UnitSystem} from "@/components/Recipe/UnitSystemToggle";
import CommentsSection from "@/components/Recipe/CommentsSection";

export default function RecipeDetailsScreen() {
    const {recipeId: recipeIdParam, productId} = useLocalSearchParams<{
        recipeId?: string | string[];
        productId?: string | string[];
    }>();
    const {selectedStores} = useSelectedStores();
    const [unitSystem, setUnitSystem] = useState<UnitSystem>("metric");

    const recipeIdValue = Array.isArray(recipeIdParam)
        ? recipeIdParam[0]
        : recipeIdParam;
    const recipeId = recipeIdValue as Id<"recipes"> | undefined;

    const productIds = useMemo(() => {
        const values = Array.isArray(productId)
            ? productId.flatMap(value => value.split(","))
            : productId
                ? productId.split(",")
                : [];

        return [...new Set(
            values
                .map(value => value.trim())
                .filter(value => value.length > 0),
        )] as Id<"products">[];
    }, [productId]);


    const result = useQuery(
        api.recipes.getRecipeById,
        recipeId
            // @ts-ignore
            ? {recipeId, productIds}
            : "skip",
    );
    const deals = useQuery(api.deals.getDealsByStore, {
        stores: selectedStores,
    });

    const dealProductIds = useMemo(() => {
        return new Set<string>(
            (deals ?? []).map(deal => deal.productId),
        );
    }, [deals]);

    if (!recipeId || result === undefined) {
        return (
            <View className="flex-1 items-center justify-center bg-black">
                <ActivityIndicator size="large" color="#f97316" />
                <Text className="mt-4 text-sm text-white/55">
                    Ładowanie przepisu...
                </Text>
            </View>
        );
    }

    if (result === null) {
        return (
            <View className="flex-1 items-center justify-center bg-black px-6">
                <Text className="text-center text-xl font-bold text-white">
                    Nie znaleziono przepisu.
                </Text>
            </View>
        );
    }

    const {recipe, ingredientGroups, steps} = result;
    const ownedIngredients = ingredientGroups.filter(group => group.ingredients[0].inDeal).length;

    const promotedIngredients = ingredientGroups.filter(group => {
        const ingredient = group.ingredients[0];

        return ingredient
            ? dealProductIds.has(ingredient.productId)
            : false;
    }).length;

    const matchPercentage = ingredientGroups.length > 0
        ? Math.round((ownedIngredients / ingredientGroups.length) * 100)
        : 0;

    return (
        <ScrollView className="flex-1 bg-black"
                    contentContainerStyle={{paddingBottom: 48}}
                    showsVerticalScrollIndicator={false}
        >
            <RecipeHeader recipe={recipe} />

            <View className="px-2 py-1">
                <Text className="text-3xl font-bold leading-10 text-white">
                    {recipe.name}
                </Text>

                <View className="mt-4 flex-row flex-wrap gap-4">
                    <View className="flex-row items-center gap-2">
                        <Clock size={19} color="rgba(255, 255, 255, 0.75)" />
                        <Text className="text-sm text-white/75">
                            {recipe.cookingMinutes} min
                        </Text>
                    </View>

                    <View className="flex-row items-center gap-2">
                        <Users size={19} color="rgba(255, 255, 255, 0.75)" />
                        <Text className="text-sm text-white/75">
                            {recipe.servings} porcji
                        </Text>
                    </View>

                    {promotedIngredients > 0 && (
                        <View className="flex-row items-center gap-2">
                            <Tag size={18} color="#fb923c" />
                            <Text className="text-sm font-medium text-orange-400">
                                {promotedIngredients} w promocji
                            </Text>
                        </View>
                    )}
                </View>

                {ownedIngredients > 0 && (
                    <View className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
                        <View className="flex-row items-center justify-between">
                            <Text className="text-sm text-emerald-100/80">
                                Masz {ownedIngredients} z {ingredientGroups.length} składników
                            </Text>

                            <Text className="font-bold text-emerald-400">
                                {matchPercentage}%
                            </Text>
                        </View>

                        <View className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                            <View className="h-full rounded-full bg-emerald-400"
                                  style={{width: `${matchPercentage}%`}}
                            />
                        </View>
                    </View>
                )}

                <View className="mt-10 flex-row items-end justify-between gap-4">
                    <View className="flex-1">
                        <Text className="text-sm text-white/50">
                            {ingredientGroups.length} składników
                        </Text>
                        <Text className="mt-1 text-2xl font-bold text-white">
                            Składniki
                        </Text>
                    </View>

                    <UnitSystemToggle value={unitSystem}
                                      onValueChange={setUnitSystem}
                    />
                </View>

                <View className="mt-5">
                    <RecipeIngredients ingredientGroups={ingredientGroups}
                                       dealProductIds={dealProductIds}
                                       unitSystem={unitSystem}
                    />
                </View>

                <View className="mt-12">
                    <RecipeSteps steps={steps} />
                </View>
            </View>
        </ScrollView>
    );
}