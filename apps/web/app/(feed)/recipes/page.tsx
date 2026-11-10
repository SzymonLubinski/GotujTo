import Link from "next/link";
import {connection} from "next/server";
import {fetchQuery} from "convex/nextjs";
import {api} from "@gotujto/convex/_generated/api";
import type {Metadata} from "next";

export const metadata: Metadata = {
    title: "Wszystkie przepisy",
    description: "Pelna lista przepisow kulinarnych GotujTo.",
    alternates: {
        canonical: "/recipes",
    },
};

export default async function RecipesPage() {
    // Convex creates a random request identifier, so this route is dynamic.
    await connection();

    const recipes = await fetchQuery(api.recipes.getRecipeDirectory, {});

    return (
        <main className="relative z-10 h-full overflow-y-auto bg-background px-5 pb-32 pt-10 text-foreground sm:px-8">
            <div className="mx-auto w-full max-w-4xl">
                <h1 className="text-3xl font-bold tracking-tight">
                    Wszystkie przepisy
                </h1>
                <p className="mt-3 text-muted-foreground">
                    Przegladaj {recipes.length} przepisow GotujTo.
                </p>

                <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                    {recipes.map(recipe => (
                        <li key={recipe.recipeId}>
                            <Link
                                href={`/recipe/${recipe.recipeId}`}
                                className="block rounded-2xl border p-5 transition-colors hover:bg-muted"
                            >
                                <h2 className="font-semibold">{recipe.name}</h2>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    {recipe.description || `Przepis. Czas przygotowania: ${recipe.cookingMinutes} min.`}
                                </p>
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </main>
    );
}
