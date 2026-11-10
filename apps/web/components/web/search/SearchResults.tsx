import Link from "next/link"
import { ChevronRight, SearchX, Sparkles } from "lucide-react"
import type { Doc } from "@gotujto/convex/_generated/dataModel"
import type { SearchResultsType } from "@gotujto/shared/types/result-type"

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
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            {recipes.map(recipe => (
                <Link key={recipe._id} href={`/recipe/${recipe._id}`} className="group flex min-h-16 items-center gap-3 border-b border-white/10 px-4 py-3 last:border-b-0 transition-colors hover:bg-white/8">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-lime-400/10 text-lg">🍽️</div>
                    <p className="min-w-0 flex-1 font-medium text-white">{recipe.name}</p>
                    <ChevronRight className="size-5 shrink-0 text-white/35 transition-transform group-hover:translate-x-0.5 group-hover:text-lime-400" />
                </Link>
            ))}
        </div>
    )
}

function CategorySection({ title, recipes }: CategorySectionProps) {
    if (recipes.length === 0) return null

    return (
        <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white/50">{formatCategoryName(title)}</h2>
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

function isVegeAndVeganQuery(query: string) {
    return ["wege", "wegetarianski", "wegetarianska", "wegetarianskie"].includes(
        query.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase(),
    )
}

export default function SearchResults({ query, results }: SearchResultsProps) {
    if (!query) {
        return (
            <section className="mx-auto flex min-h-full w-full max-w-3xl items-center justify-center px-5 py-12">
                <div className="max-w-sm text-center">
                    <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-lime-400/10 text-lime-400"><Sparkles className="size-8" /></div>
                    <h1 className="mt-5 text-2xl font-bold text-white">Znajdź pomysł na posiłek</h1>
                    <p className="mt-3 leading-6 text-white/55">Wpisz nazwę dania, dietę albo okazję, na przykład: makaron, wegetariańskie lub obiad.</p>
                </div>
            </section>
        )
    }

    if (!results) return null

    const { recipesByName, categories } = results
    const dietGroups = isVegeAndVeganQuery(query)
        ? [["Vege i wegan", categories.recipesByDiets] as const]
        : groupRecipesByMatchingCategory(categories.recipesByDiets, recipe => recipe.diets, query)
    const occasionGroups = groupRecipesByMatchingCategory(categories.recipesByOccasions, recipe => recipe.occasions, query)
    const mealTypeGroups = groupRecipesByMatchingCategory(categories.recipesByMealTypes, recipe => recipe.types, query)
    const hasResults = recipesByName.length > 0 || dietGroups.length > 0 || occasionGroups.length > 0 || mealTypeGroups.length > 0

    if (!hasResults) {
        return (
            <div className="mx-auto flex min-h-full w-full max-w-3xl items-center justify-center px-6 py-12">
                <div className="max-w-sm text-center">
                    <SearchX className="mx-auto size-10 text-white/30" />
                    <h1 className="mt-4 text-xl font-semibold text-white">Brak wyników dla „{query}”</h1>
                    <p className="mt-2 leading-6 text-white/55">Spróbuj krótszego lub bardziej ogólnego hasła.</p>
                </div>
            </div>
        )
    }

    return (
        <div aria-label="Wyniki wyszukiwania" className="mx-auto w-full max-w-3xl space-y-8 px-5 py-6">
            <div>
                <p className="text-sm text-white/50">Wyniki dla</p>
                <h1 className="mt-1 text-2xl font-bold text-white">„{query}”</h1>
            </div>

            {recipesByName.length > 0 && <section className="space-y-3"><h2 className="text-sm font-semibold uppercase tracking-wider text-white/50">Przepisy</h2><RecipeLinkList recipes={recipesByName} /></section>}
            {dietGroups.map(([diet, recipes], index) => <CategorySection key={`diet-${diet}-${index}`} title={diet} recipes={recipes} />)}
            {occasionGroups.map(([occasion, recipes], index) => <CategorySection key={`occasion-${occasion}-${index}`} title={occasion} recipes={recipes} />)}
            {mealTypeGroups.map(([mealType, recipes], index) => <CategorySection key={`type-${mealType}-${index}`} title={mealType} recipes={recipes} />)}
        </div>
    )
}
