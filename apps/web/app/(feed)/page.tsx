import {fetchQuery} from "convex/nextjs";
import {api} from "@gotujto/convex/_generated/api";
import HomeFeed from "@/components/web/feed/HomeFeed";

const siteUrl = "https://gotujto.com";

export default async function FeedPage() {
    const initialRecipes = await fetchQuery(api.recipes.getHomeFeedRecipes, {
        limit: 6,
    });

    const itemListStructuredData = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Przepisy kulinarne GotujTo",
        itemListElement: initialRecipes.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: new URL(`/recipe/${item.recipe._id}`, siteUrl).toString(),
            name: item.recipe.name,
            ...(item.recipe.description
                ? {description: item.recipe.description}
                : {}),
        })),
    };

    return (
        <>
            <h1 className="sr-only">
                Przepisy kulinarne dopasowane do produktów i promocji
            </h1>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(itemListStructuredData)
                        .replace(/</g, "\\u003c"),
                }}
            />
            <HomeFeed initialRecipes={initialRecipes} />
        </>
    );
}
