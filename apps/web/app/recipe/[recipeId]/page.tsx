import {fetchQuery} from "convex/nextjs";
import {api} from "@gotujto/convex/_generated/api";
import {type Id} from "@gotujto/convex/_generated/dataModel";
import {RecipeDetails} from "@/components/web/recipe-card/RecipeDetails";
import type {Metadata} from "next";
import {AdminRecipeEditButton} from "@/components/web/recipe-card/AdminRecipeEditButton";
import {notFound} from "next/navigation";
import type {RecipeResultsType} from "@gotujto/shared/types/result-type";

type RecipePageProps = {
    params: Promise<{
        recipeId: Id<"recipes">;
    }>;
    searchParams: Promise<{
        dealProductIds?: string | string[];
        fridgeProductIds?: string | string[];
    }>;
};

type RecipeResult = NonNullable<RecipeResultsType>;

const siteUrl = "https://gotuj-to.vercel.app"

function getRecipeStructuredData(
    result: RecipeResult,
    recipeId: Id<"recipes">,
) {
    const {recipe, ingredientGroups, steps} = result;
    const image = recipe.images[0];

    if (!image) {
        return null;
    }

    const recipeIngredients = ingredientGroups.flatMap(group => {
        const ingredient = group.ingredients[0];

        if (!ingredient) {
            return [];
        }

        const quantity = [
            ingredient.metricQuantity,
            ingredient.metricUnit,
        ].filter(value => value !== null && value !== undefined).join(" ");

        return [
            `${quantity}${quantity ? " " : ""}${ingredient.productName}${ingredient.optional ? " (opcjonalnie)" : ""}`,
        ];
    });

    return {
        "@context": "https://schema.org",
        "@type": "Recipe",
        name: recipe.name,
        description: recipe.description ?? undefined,
        image: [image],
        author: {
            "@type": "Person",
            name: recipe.authorName ?? recipe.authorId,
        },
        datePublished: new Date(recipe._creationTime).toISOString(),
        totalTime: `PT${recipe.cookingMinutes}M`,
        recipeYield: `${recipe.servings} porcji`,
        recipeCategory: recipe.types.join(", ") || undefined,
        keywords: [
            ...recipe.types,
            ...recipe.diets,
            ...recipe.occasions,
        ].join(", ") || undefined,
        inLanguage: "pl-PL",
        mainEntityOfPage: new URL(
            `/recipe/${recipeId}`,
            siteUrl,
        ).toString(),
        recipeIngredient: recipeIngredients,
        recipeInstructions: [...steps]
            .sort((first, second) => first.stepNum - second.stepNum)
            .map(step => ({
                "@type": "HowToStep",
                name: `Krok ${step.stepNum}`,
                text: step.description,
            })),
    };
}

export async function generateMetadata({params}: RecipePageProps): Promise<Metadata> {
    const {recipeId} = await params;

    const result = await fetchQuery(
        api.recipes.getRecipeById,
        {
            recipeId,
            dealProductIds: [],
            fridgeProductIds: [],
        },
    );

    if (!result) {
        return {
            title: "Nie znaleziono przepisu",
            robots: {
                index: false,
                follow: false,
            },
        };
    }

    const {recipe} = result;

    const description =
        recipe.description?.trim() ||
        `Przepis na ${recipe.name}. Czas przygotowania: ${recipe.cookingMinutes} minut.`;

    const canonicalUrl = `/recipe/${recipeId}`;
    const image = recipe.images[0];

    return {
        title: recipe.name,
        description,

        alternates: {
            canonical: canonicalUrl,
        },

        openGraph: {
            type: "article",
            locale: "pl_PL",
            siteName: "GotujTo",
            title: recipe.name,
            description,
            url: canonicalUrl,
            images: image
                ? [{url: image, alt: recipe.name}]
                : [],
        },

        twitter: {
            card: "summary_large_image",
            title: recipe.name,
            description,
            images: image ? [image] : [],
        },
    };
}

function parseProductIds(
    value: string | string[] | undefined,
): Id<"products">[] {
    const values = Array.isArray(value)
        ? value
        : value
            ? [value]
            : [];

    return [
        ...new Set(
            values
                .flatMap(item => item.split(","))
                .map(item => item.trim())
                .filter(Boolean),
        ),
    ] as Id<"products">[];
}

export default async function RecipePage({params, searchParams}: RecipePageProps) {
    const [{recipeId}, {
            dealProductIds: dealProductIdsParam,
            fridgeProductIds: fridgeProductIdsParam,
        },
    ] = await Promise.all([
        params,
        searchParams,
    ]);

    const dealProductIds =
        parseProductIds(dealProductIdsParam);

    const fridgeProductIds =
        parseProductIds(fridgeProductIdsParam);

    const result = await fetchQuery(
        api.recipes.getRecipeById,
        {
            recipeId,
            dealProductIds,
            fridgeProductIds,
        },
    );

    if (!result) {
        notFound();
    }

    const recipeStructuredData = getRecipeStructuredData(
        result,
        recipeId,
    );

    return (
        <>
            {recipeStructuredData && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(recipeStructuredData)
                            .replace(/</g, "\\u003c"),
                    }}
                />
            )}
            <AdminRecipeEditButton recipeId={recipeId}/>
            <RecipeDetails result={result} />
        </>
    )
}
