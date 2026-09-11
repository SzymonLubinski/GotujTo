import {fetchQuery} from "convex/nextjs";
import {api} from "@gotujto/convex/_generated/api";
import {type Id} from "@gotujto/convex/_generated/dataModel";
import {RecipeDetails} from "@/components/web/recipe-card/RecipeDetails";

type RecipePageProps = {
    params: Promise<{
        recipeId: Id<"recipes">;
    }>;
    searchParams: Promise<{
        dealProductIds?: string | string[];
        fridgeProductIds?: string | string[];
    }>;
};

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

export default async function RecipePage({
                                             params,
                                             searchParams,
                                         }: RecipePageProps) {
    const [
        {recipeId},
        {
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

    return <RecipeDetails result={result} />;
}