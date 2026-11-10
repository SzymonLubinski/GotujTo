import {fetchQuery} from "convex/nextjs";
import {api} from "@gotujto/convex/_generated/api";
import HomeFeed from "@/components/web/feed/HomeFeed";
import {connection} from "next/server";
import type {Metadata} from "next";

const siteUrl = "https://gotujto.com";

export const metadata: Metadata = {
    alternates: {
        canonical: "/",
    },
};

export default async function FeedPage() {
    // Convex's server client creates a random request identifier internally.
    // This feed must therefore render at request time, not during static export.
    await connection();

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

    const websiteStructuredData = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "GotujTo",
        alternateName: ["Gotuj To", "gotujto.com"],
        url: siteUrl,
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
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(websiteStructuredData)
                        .replace(/</g, "\\u003c"),
                }}
            />
            <HomeFeed initialRecipes={initialRecipes} />
        </>
    );
}
