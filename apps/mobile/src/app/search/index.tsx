import {useEffect, useMemo, useState} from "react";
import {ActivityIndicator, Pressable, ScrollView, TextInput, View} from "react-native";
import {useRouter} from "expo-router";
import {useQuery} from "convex/react";
import {ArrowLeft, Search, X} from "lucide-react-native";

import {api} from "@gotujto/convex/_generated/api";
import type {SearchResultsType} from "@gotujto/shared/types/result-type";
import {Text} from "@/components/ui/text";

const SEARCH_DELAY_MS = 300;
type SearchRecipe = SearchResultsType["recipesByName"][number];

export default function SearchScreen() {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const normalizedQuery = query.trim();
    const results = useQuery(
        api.recipes.searchRecipes,
        debouncedQuery ? {query: debouncedQuery} : "skip",
    );

    useEffect(() => {
        const timeout = setTimeout(() => {
            setDebouncedQuery(normalizedQuery);
        }, SEARCH_DELAY_MS);

        return () => clearTimeout(timeout);
    }, [normalizedQuery]);

    const sections = useMemo(() => {
        if (!results) {
            return [];
        }

        return [
            {title: "Przepisy", recipes: results.recipesByName},
            ...groupByCategory(results.categories.recipesByDiets, recipe => recipe.diets, debouncedQuery),
            ...groupByCategory(results.categories.recipesByOccasions, recipe => recipe.occasions, debouncedQuery),
            ...groupByCategory(results.categories.recipesByMealTypes, recipe => recipe.types, debouncedQuery),
        ].filter(section => section.recipes.length > 0);
    }, [debouncedQuery, results]);

    return (
        <View className="flex-1 bg-black">
            <View className="flex-row items-center gap-3 border-b border-white/10 px-5 pb-4 pt-14">
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Wroc"
                    onPress={() => router.canGoBack() ? router.back() : router.replace("/")}
                    className="h-10 w-10 items-center justify-center rounded-full active:bg-white/10"
                >
                    <ArrowLeft size={21} color="#ffffff" />
                </Pressable>
                <View className="h-11 flex-1 flex-row items-center rounded-full border border-white/15 bg-white/5 px-4">
                    <Search size={19} color="rgba(255,255,255,0.55)" />
                    <TextInput
                        autoFocus
                        value={query}
                        onChangeText={setQuery}
                        placeholder="Szukaj przepisow, diet i okazji"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        className="h-full flex-1 px-3 text-base text-white"
                        returnKeyType="search"
                    />
                    {query.length > 0 && (
                        <Pressable accessibilityRole="button" accessibilityLabel="Wyczysc" onPress={() => setQuery("")} hitSlop={8}>
                            <X size={18} color="rgba(255,255,255,0.65)" />
                        </Pressable>
                    )}
                </View>
            </View>

            <ScrollView contentContainerStyle={{padding: 20, paddingBottom: 44}} keyboardShouldPersistTaps="handled">
                {!normalizedQuery ? (
                    <Text className="pt-8 text-center text-sm text-white/55">Wpisz nazwe przepisu, skladnika, diety lub okazji.</Text>
                ) : results === undefined ? (
                    <View className="pt-12"><ActivityIndicator color="#a3e635" /></View>
                ) : sections.length === 0 ? (
                    <Text className="pt-8 text-center text-sm text-white/55">Nie znaleziono pasujacych przepisow.</Text>
                ) : (
                    <View className="gap-8">
                        {sections.map(section => (
                            <View key={section.title}>
                                <Text className="mb-3 text-lg font-bold text-white">{section.title}</Text>
                                <View className="gap-2">
                                    {section.recipes.map(recipe => (
                                        <Pressable
                                            key={recipe._id}
                                            accessibilityRole="link"
                                            onPress={() => router.push(`/recipe/${recipe._id}` as never)}
                                            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 active:bg-white/10"
                                        >
                                            <Text className="text-base font-semibold text-white">{recipe.name}</Text>
                                            <Text className="mt-1 text-sm text-white/55">{recipe.cookingMinutes} min · {recipe.servings} porcji</Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

function groupByCategory(
    recipes: SearchRecipe[],
    getCategories: (recipe: SearchRecipe) => readonly string[],
    query: string,
) {
    const normalizedQuery = query.toLowerCase();
    const groups = new Map<string, SearchRecipe[]>();

    for (const recipe of recipes) {
        for (const category of getCategories(recipe)) {
            if (!category.toLowerCase().includes(normalizedQuery)) {
                continue;
            }

            groups.set(category, [...(groups.get(category) ?? []), recipe]);
        }
    }

    return [...groups].map(([title, groupedRecipes]) => ({
        title: formatCategory(title),
        recipes: groupedRecipes,
    }));
}

function formatCategory(value: string) {
    return value.replaceAll("_", " ").replace(/^./, character => character.toUpperCase());
}
