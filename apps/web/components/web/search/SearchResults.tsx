import Link from "next/link"
import { Doc } from "@gotujto/convex/_generated/dataModel"
import {SearchResultsType} from "@gotujto/shared/types/result-type";
import SearchResultsSkeleton from "@/components/web/search/SearchResultsSkeleton";

type SearchResultsProps = {
    query: string
    results: SearchResultsType | undefined
}

type RecipeLinkListProps = {
    recipes: Doc<"recipes">[]
}

type CategorySectionProps = {
    title: string
    recipes: Doc<"recipes">[]
}

function formatCategoryName(value: string) {
    return value.replaceAll("_", " ").replace(/^./, character => character.toUpperCase())
}

function RecipeLinkList({ recipes }: RecipeLinkListProps) {
    return (
        <div className="space-y-2">
            {recipes.map(recipe => (
                <Link key={recipe._id} href={`/recipe/${recipe._id}`} className="block rounded-xl bg-muted p-3 transition-colors hover:bg-muted/70">
                    <p className="font-medium">{recipe.name}</p>
                </Link>
            ))}
        </div>
    )
}

function CategorySection({ title, recipes }: CategorySectionProps) {
    if (recipes.length === 0) return null

    return (
        <section className="space-y-3">
            <h2 className="text-lg font-semibold">{formatCategoryName(title)}</h2>
            <RecipeLinkList recipes={recipes} />
        </section>
    )
}

function groupRecipesByMatchingCategory(recipes: Doc<"recipes">[], getCategories: (recipe: Doc<"recipes">) => readonly string[], query: string) {
    const normalizedQuery = query.trim().toLowerCase()
    const groups = new Map<string, Doc<"recipes">[]>()

    recipes.forEach(recipe => {
        const matchingCategories = getCategories(recipe).filter(category => category.toLowerCase().includes(normalizedQuery))

        matchingCategories.forEach(category => {
            const currentRecipes = groups.get(category) ?? []
            groups.set(category, [...currentRecipes, recipe])
        })
    })

    return Array.from(groups.entries())
}

export default function SearchResults({ query, results }: SearchResultsProps) {
    const { recipesByName, categories } = results

    const dietGroups = groupRecipesByMatchingCategory(categories.recipesByDiets, recipe => recipe.diets, query)
    const occasionGroups = groupRecipesByMatchingCategory(categories.recipesByOccasions, recipe => recipe.occasions, query)
    const mealTypeGroups = groupRecipesByMatchingCategory(categories.recipesByMealTypes, recipe => recipe.types, query)

    const hasResults = recipesByName.length > 0 || dietGroups.length > 0 || occasionGroups.length > 0 || mealTypeGroups.length > 0

    if (!hasResults) {
        return (
            <div className="flex flex-1 items-center justify-center p-6">
                <p className="text-center text-muted-foreground">Nie znaleziono pasujących przepisów.</p>
            </div>
        )
    }

    return (
        <div aria-label="Wyniki wyszukiwania" className="space-y-8 p-4">
            {recipesByName.length > 0 && (
                <section className="space-y-3">
                    <h2 className="text-lg font-semibold">Przepisy</h2>
                    <RecipeLinkList recipes={recipesByName} />
                </section>
            )}

            {dietGroups.map(([diet, recipes], index) => (
                <CategorySection key={`diet-${diet}-${index}`} title={diet} recipes={recipes} />
            ))}

            {occasionGroups.map(([occasion, recipes], index) => (
                <CategorySection key={`occasion-${occasion}-${index}`} title={occasion} recipes={recipes} />
            ))}

            {mealTypeGroups.map(([mealType, recipes], index) => (
                <CategorySection key={`type-${mealType}-${index}`} title={mealType} recipes={recipes} />
            ))}
        </div>
    )
}