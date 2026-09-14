import {fetchQuery} from "convex/nextjs";
import {api} from "@gotujto/convex/_generated/api";
import {type Id} from "@gotujto/convex/_generated/dataModel";
import {RecipeDetails} from "@/components/web/recipe-card/RecipeDetails";
import type {Metadata} from "next";
import {AdminRecipeEditButton} from "@/components/web/recipe-card/AdminRecipeEditButton";

type RecipePageProps = {
    params: Promise<{
        recipeId: Id<"recipes">;
    }>;
    searchParams: Promise<{
        dealProductIds?: string | string[];
        fridgeProductIds?: string | string[];
    }>;
};

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

    return (
        <>
            <AdminRecipeEditButton recipeId={recipeId}/>
            <RecipeDetails result={result} />
        </>
    )
}