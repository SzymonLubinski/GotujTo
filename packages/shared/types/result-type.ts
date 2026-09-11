import type {FunctionReturnType} from "convex/server";
import type {api} from "../../convex/_generated/api";

type DealsItem =
    FunctionReturnType<
        typeof api.recipes.getRecipesByDeals
    >[number];

type FridgeItem =
    FunctionReturnType<
        typeof api.recipes.getRecipesByProducts
    >[number];

type StandardItem =
    FunctionReturnType<
        typeof api.recipes.getRecipesPaginated
    >["page"][number];

type SocialItem =
    FunctionReturnType<
        typeof api.social.getSocialContent
    >[number];

type BlogItem =
    FunctionReturnType<
        typeof api.blog.getBlogContentPaginated
    >["page"][number];

export type ShortItemData =
    | (Omit<DealsItem, "source"> & {
    source: "deals";
})
    | (Omit<FridgeItem, "source"> & {
    source: "fridge";
})
    | (Omit<StandardItem, "source"> & {
    source: "standard";
});

export type SearchResultsType =
    FunctionReturnType<
        typeof api.recipes.searchRecipes
    >;

export type RecipeResultsType =
    FunctionReturnType<
        typeof api.recipes.getRecipeById
    >;

export type RecipeShortsFeedItem = {
    type: "recipe";
    id: string;
    data: ShortItemData;
};

export type SocialShortsFeedItem = {
    type: "social";
    id: string;
    title: SocialItem["title"];
    description: SocialItem["description"];
    instagramUrl: SocialItem["instagramUrl"];
    facebookUrl: SocialItem["facebookUrl"];
};

export type BlogShortsFeedItem = {
    type: "blog";
    id: string;
    blogType: BlogItem["type"];
    title: BlogItem["title"];
    description: BlogItem["description"];
    images: BlogItem["images"];
    videoKey: BlogItem["videoKey"];
};

export type AdShortsFeedItem = {
    type: "ad";
    id: string;
    slot: number;
};

export type ShortsFeedItem =
    | RecipeShortsFeedItem
    | SocialShortsFeedItem
    | BlogShortsFeedItem
    | AdShortsFeedItem;