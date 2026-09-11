
import {Doc} from "@gotujto/convex/_generated/dataModel";

type RecipeSectionProps = {
    title: string
    recipes: Doc<"recipes">[]
}

export default function RecipeSection({ title, recipes }: RecipeSectionProps) {
    if (recipes.length === 0) return null

    return (
        <section aria-labelledby={`search-section-${title}`}>
            <h2 id={`search-section-${title}`} className="mb-3 text-lg font-semibold">
                {title}
            </h2>

            <div className="space-y-2">
                {recipes.map(recipe => (
                    <article key={recipe._id} className="rounded-xl bg-muted p-3">
                        <p className="font-medium">{recipe.name}</p>
                    </article>
                ))}
            </div>
        </section>
    )
}