import type {MetadataRoute} from "next";
import {fetchQuery} from "convex/nextjs";
import {api} from "@gotujto/convex/_generated/api";

const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://gotujto.pl";

export default async function sitemap():
    Promise<MetadataRoute.Sitemap> {
    const recipes = await fetchQuery(
        api.recipes.getRecipesForSitemap,
        {},
    );

    return [
        {
            url: siteUrl,
            changeFrequency: "daily",
            priority: 1,
        },
        ...recipes.map(recipe => ({
            url:
                `${siteUrl}/recipe/${recipe.recipeId}`,
            lastModified: new Date(
                recipe.createdAt,
            ),
            changeFrequency:
                "monthly" as const,
            priority: 0.8,
        })),
    ];
}