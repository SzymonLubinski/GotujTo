// noinspection JSUnusedGlobalSymbols

import {mutation, query, type QueryCtx} from "./_generated/server";
import {ConvexError, v} from "convex/values";
import {paginationOptsValidator} from "convex/server";
import {filter} from "convex-helpers/server/filter";
import {type Doc, type Id} from "./_generated/dataModel";
import {customaryUnits, dietTypes, mealTypes, metricUnits, occasions, stores} from "../shared/data/stableData";

const DEFAULT_DEALS_LIMIT = 10;
const MAX_DEALS_LIMIT = 30;
const DEFAULT_FRIDGE_LIMIT = 20;
const MAX_FRIDGE_LIMIT = 50;
const CANDIDATE_MULTIPLIER = 3;

const productObjectV = v.object({
    productId: v.id("products"),
    metricQuantity: v.number(),
    metricUnit: v.union(...metricUnits.map(unit => v.literal(unit))),
    customaryUnit: v.union(...customaryUnits.map(unit => v.literal(unit))),
    customaryQuantity: v.number(),
    optional: v.boolean(),
});

const recipeFieldsV = v.object({
    name: v.string(),
    cookingMinutes: v.number(),
    servings: v.number(),
    images: v.array(v.id("_storage")),
    videoKey: v.optional(v.string()),
    diets: v.array(v.union(...dietTypes.map(type => v.literal(type)))),
    types: v.array(v.union(...mealTypes.map(type => v.literal(type)))),
    occasions: v.array(v.union(...occasions.map(occasion => v.literal(occasion)))),
    description: v.optional(v.string()),
});

const ingredientGroupsV = v.array(v.object({
    main: productObjectV,
    substitutes: v.array(productObjectV),
}));

const recipeStepsV = v.array(v.object({
    description: v.string(),
}));

type RecipeCandidate = {
    recipe: Doc<"recipes">;
    ingredients: Doc<"ingredients">[];
    matchedProductIds: Set<Id<"products">>;
};

type RecipeMatch = {
    groupsMap: Map<number, Doc<"ingredients">[]>;
    missingGroups: Doc<"ingredients">[];
    requiredGroups: number;
    matchedGroups: number;
    matchPercentage: number;
};

export const createRecipe = mutation({
    args: {
        step1: recipeFieldsV,
        step2: ingredientGroupsV,
        step3: recipeStepsV,
    },
    handler: async (ctx, args) => {
        try {
            const recipeId = await ctx.db.insert("recipes", {
                authorId: "David",
                authorName: "David",
                favorite: 0,
                ...args.step1,
            });

            const ingredients = args.step2.flatMap((group, groupIndex) => {
                const mainIngredient = {
                    recipeId,
                    ...group.main,
                    substitutionGroup: groupIndex,
                    groupLevel: 0,
                };
                const substitutes = group.substitutes.map((substitute, substituteIndex) => ({
                    recipeId,
                    ...substitute,
                    substitutionGroup: groupIndex,
                    groupLevel: substituteIndex + 1,
                }));

                return [mainIngredient, ...substitutes];
            });

            await Promise.all(
                ingredients.map(ingredient => ctx.db.insert("ingredients", ingredient)),
            );

            await Promise.all(
                args.step3.map((step, index) => ctx.db.insert("steps", {
                    recipeId,
                    description: step.description,
                    stepNum: index + 1,
                })),
            );

            return recipeId;
        } catch (error) {
            console.error(error);
            throw new ConvexError({
                code: "CREATE_RECIPE_FAILED",
                message: "Nie udało się dodać przepisu.",
            });
        }
    },
});

export const updateRecipe = mutation({
    args: {
        recipeId: v.id("recipes"),
        step1: recipeFieldsV,
        step2: ingredientGroupsV,
        step3: recipeStepsV,
    },
    handler: async (ctx, args) => {
        const recipe = await ctx.db.get(args.recipeId);

        if (!recipe) {
            throw new ConvexError({code: "RECIPE_NOT_FOUND", message: "Nie znaleziono przepisu."});
        }

        const [ingredients, steps] = await Promise.all([
            ctx.db.query("ingredients").withIndex("by_recipeId", index => index.eq("recipeId", args.recipeId)).collect(),
            ctx.db.query("steps").withIndex("by_recipeId", index => index.eq("recipeId", args.recipeId)).collect(),
        ]);

        await ctx.db.patch(args.recipeId, args.step1);
        await Promise.all([
            ...ingredients.map(ingredient => ctx.db.delete(ingredient._id)),
            ...steps.map(step => ctx.db.delete(step._id)),
        ]);

        const newIngredients = args.step2.flatMap((group, groupIndex) => [
            {
                recipeId: args.recipeId,
                ...group.main,
                substitutionGroup: groupIndex,
                groupLevel: 0,
            },
            ...group.substitutes.map((substitute, substituteIndex) => ({
                recipeId: args.recipeId,
                ...substitute,
                substitutionGroup: groupIndex,
                groupLevel: substituteIndex + 1,
            })),
        ]);

        await Promise.all([
            ...newIngredients.map(ingredient => ctx.db.insert("ingredients", ingredient)),
            ...args.step3.map((step, index) => ctx.db.insert("steps", {
                recipeId: args.recipeId,
                stepNum: index + 1,
                description: step.description,
            })),
        ]);

        return args.recipeId;
    },
});

export const generateImageUploadUrl = mutation({
    args: {},
    handler: async ctx => {
        return await ctx.storage.generateUploadUrl();
    },
});

export const getRecipeForEditing = query({
    args: {
        recipeId: v.id("recipes"),
    },
    handler: async (ctx, args) => {
        const recipe = await ctx.db.get(args.recipeId);

        if (!recipe) {
            return null;
        }

        const [ingredients, steps, imageUrls] = await Promise.all([
            ctx.db.query("ingredients").withIndex("by_recipeId", index => index.eq("recipeId", args.recipeId)).collect(),
            ctx.db.query("steps").withIndex("by_recipeId", index => index.eq("recipeId", args.recipeId)).collect(),
            Promise.all(recipe.images.map(storageId => ctx.storage.getUrl(storageId))),
        ]);

        const productIds = [...new Set(ingredients.map(ingredient => ingredient.productId))];
        const productNames = new Map(
            (await Promise.all(productIds.map(productId => ctx.db.get(productId))))
                .filter((product): product is Doc<"products"> => product !== null)
                .map(product => [product._id, product.name]),
        );
        const groups = groupIngredients(ingredients);

        return {
            step1: {
                name: recipe.name,
                cookingMinutes: recipe.cookingMinutes,
                servings: recipe.servings,
                images: recipe.images.flatMap((storageId, index) => {
                    const previewUrl = imageUrls[index];

                    return previewUrl
                        ? [{id: storageId, storageId, previewUrl}]
                        : [];
                }),
                video: recipe.videoKey
                    ? {
                        id: recipe.videoKey,
                        videoKey: recipe.videoKey,
                        previewUrl: `${process.env.R2_PUBLIC_URL}/${recipe.videoKey}`,
                    }
                    : undefined,
                diets: recipe.diets,
                types: recipe.types,
                occasions: recipe.occasions,
                description: recipe.description ?? "",
            },
            step2: [...groups.entries()]
                .sort(([first], [second]) => first - second)
                .flatMap(([, group]) => {
                    const sorted = [...group].sort((first, second) => first.groupLevel - second.groupLevel);
                    const [main, ...substitutes] = sorted.map(ingredient => ({
                        productId: ingredient.productId,
                        productName: productNames.get(ingredient.productId) ?? "",
                        metricUnit: ingredient.metricUnit,
                        customaryUnit: ingredient.customaryUnit,
                        metricQuantity: ingredient.metricQuantity,
                        customaryQuantity: ingredient.customaryQuantity,
                        optional: ingredient.optional,
                    }));

                    return main ? [{main, substitutes}] : [];
                }),
            step3: [...steps]
                .sort((first, second) => first.stepNum - second.stepNum)
                .map(step => ({description: step.description})),
        };
    },
});

export const searchRecipes = query({
    args: {
        query: v.string(),
    },
    handler: async (ctx, args) => {
        const searchQuery = args.query.trim().toLowerCase();

        if (searchQuery.length === 0) {
            return {
                recipesByName: [],
                categories: {
                    recipesByDiets: [],
                    recipesByOccasions: [],
                    recipesByMealTypes: [],
                },
            };
        }

        const matchQuery = <T extends string>(items: readonly T[]) => {
            return items.filter(item => item.toLowerCase().includes(searchQuery));
        };

        const filteredDiets = new Set(matchQuery(dietTypes));
        const filteredOccasions = new Set(matchQuery(occasions));
        const filteredMealTypes = new Set(matchQuery(mealTypes));
        const hasMatchingCategory =
            filteredDiets.size > 0 ||
            filteredOccasions.size > 0 ||
            filteredMealTypes.size > 0;

        const [recipesByName, recipesByCategory] = await Promise.all([
            ctx.db
                .query("recipes")
                .withSearchIndex("by_name_prefix", searchIndex =>
                    searchIndex.search("name", searchQuery),
                )
                .take(5),
            hasMatchingCategory
                ? filter(
                    ctx.db.query("recipes"),
                    recipe =>
                        recipe.diets.some(item => filteredDiets.has(item)) ||
                        recipe.occasions.some(item => filteredOccasions.has(item)) ||
                        recipe.types.some(item => filteredMealTypes.has(item)),
                ).collect()
                : Promise.resolve([]),
        ]);

        return {
            recipesByName,
            categories: {
                recipesByDiets: recipesByCategory.filter(recipe =>
                    recipe.diets.some(item => filteredDiets.has(item)),
                ),
                recipesByOccasions: recipesByCategory.filter(recipe =>
                    recipe.occasions.some(item => filteredOccasions.has(item)),
                ),
                recipesByMealTypes: recipesByCategory.filter(recipe =>
                    recipe.types.some(item => filteredMealTypes.has(item)),
                ),
            },
        };
    },
});

export const getRecipeById = query({
    args: {
        recipeId: v.id("recipes"),
        dealProductIds: v.array(v.id("products")),
        fridgeProductIds: v.array(v.id("products")),
    },
    handler: async (ctx, args) => {
        const recipe = await ctx.db.get(args.recipeId);

        if (!recipe) {
            return null;
        }

        const [media, steps, allIngredients] =
            await Promise.all([
                getRecipeMedia(ctx, recipe),
                ctx.db
                    .query("steps")
                    .withIndex(
                        "by_recipeId",
                        index =>
                            index.eq(
                                "recipeId",
                                args.recipeId,
                            ),
                    )
                    .collect(),
                ctx.db
                    .query("ingredients")
                    .withIndex(
                        "by_recipeId",
                        index =>
                            index.eq(
                                "recipeId",
                                args.recipeId,
                            ),
                    )
                    .collect(),
            ]);

        const dealProductIds =
            new Set(args.dealProductIds);

        const fridgeProductIds =
            new Set(args.fridgeProductIds);

        const ingredientsByGroup =
            groupIngredients(allIngredients);

        const uniqueProductIds = [
            ...new Set(
                [...ingredientsByGroup.values()]
                    .flatMap(ingredients =>
                        ingredients.map(
                            ingredient =>
                                ingredient.productId,
                        ),
                    ),
            ),
        ];

        const productNamesById = new Map(
            (
                await Promise.all(
                    uniqueProductIds.map(productId =>
                        ctx.db.get(productId),
                    ),
                )
            )
                .filter(
                    (
                        product,
                    ): product is Doc<"products"> =>
                        product !== null,
                )
                .map(product => [
                    product._id,
                    product.name,
                ]),
        );

        const ingredientGroups = Array
            .from(ingredientsByGroup.entries())
            .sort(
                ([firstGroup], [secondGroup]) =>
                    firstGroup - secondGroup,
            )
            .map(([group, ingredients]) => {
                const sortedIngredients = [
                    ...ingredients,
                ].sort((first, second) => {
                    const firstPriority =
                        fridgeProductIds.has(
                            first.productId,
                        )
                            ? 0
                            : dealProductIds.has(
                                first.productId,
                            )
                                ? 1
                                : 2;

                    const secondPriority =
                        fridgeProductIds.has(
                            second.productId,
                        )
                            ? 0
                            : dealProductIds.has(
                                second.productId,
                            )
                                ? 1
                                : 2;

                    if (
                        firstPriority !==
                        secondPriority
                    ) {
                        return (
                            firstPriority -
                            secondPriority
                        );
                    }

                    return (
                        first.groupLevel -
                        second.groupLevel
                    );
                });

                const namedIngredients =
                    sortedIngredients.flatMap(
                        ingredient => {
                            const productName =
                                productNamesById.get(
                                    ingredient.productId,
                                );

                            return productName !==
                            undefined
                                ? [{
                                    ...ingredient,
                                    productName,
                                    inFridge:
                                        fridgeProductIds.has(
                                            ingredient.productId,
                                        ),
                                    inDeal:
                                        dealProductIds.has(
                                            ingredient.productId,
                                        ),
                                }]
                                : [];
                        },
                    );

                return {
                    group,
                    ingredients: namedIngredients,
                };
            });

        return {
            recipe: {
                ...recipe,
                ...media,
            },
            ingredientGroups,
            steps,
        };
    },
});

export const getRecipesByProducts = query({
    args: {
        productIds: v.array(v.id("products")),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const resultLimit = normalizeLimit(
            args.limit,
            DEFAULT_FRIDGE_LIMIT,
            MAX_FRIDGE_LIMIT,
        );
        const candidates = await getFunc1(
            ctx,
            args.productIds,
            resultLimit * CANDIDATE_MULTIPLIER,
        );
        const evaluatedCandidates = candidates.map(candidate => ({
            candidate,
            match: getFunc2(candidate.ingredients, candidate.matchedProductIds),
        }));

        evaluatedCandidates.sort((first, second) => {
            return second.match.matchPercentage - first.match.matchPercentage;
        });

        const selectedCandidates = evaluatedCandidates.slice(0, resultLimit);
        const missingProductIds = [
            ...new Set(
                selectedCandidates.flatMap(({match}) =>
                    match.missingGroups.map(ingredient => ingredient.productId),
                ),
            ),
        ];
        const missingProducts = await Promise.all(
            missingProductIds.map(productId => ctx.db.get(productId)),
        );
        const missingProductNames = new Map(
            missingProducts
                .filter((product): product is Doc<"products"> => product !== null)
                .map(product => [product._id, product.name]),
        );

        return await Promise.all(
            selectedCandidates.map(async ({candidate, match}) => {
                const media = await getRecipeMedia(ctx, candidate.recipe);

                return {
                    recipe: {...candidate.recipe, ...media},
                    requiredGroups: match.requiredGroups,
                    missingGroups: match.missingGroups,
                    source: "fridge" as const,
                    missingProductNames: match.missingGroups.flatMap(ingredient => {
                        const productName = missingProductNames.get(ingredient.productId);
                        return productName ? [productName] : [];
                    }),
                    matchedGroups: match.matchedGroups,
                    matchPercentage: match.matchPercentage,
                    fridgeProductIds: [...candidate.matchedProductIds],
                    dealProductIds: [] as Id<"products">[],
                };
            }),
        );
    },
});

export const getRecipesByDeals = query({
    args: {
        stores: v.array(v.union(...stores.map(store => v.literal(store)))),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const resultLimit = normalizeLimit(
            args.limit,
            DEFAULT_DEALS_LIMIT,
            MAX_DEALS_LIMIT,
        );
        const selectedStores = args.stores.length > 0
            ? [...new Set(args.stores)]
            : [...stores];
        const deals = (
            await Promise.all(
                selectedStores.map(store =>
                    ctx.db
                        .query("deals")
                        .withIndex("by_store", index => index.eq("store", store))
                        .collect(),
                ),
            )
        ).flat();

        const bestDealByProductId = new Map<
            Id<"products">,
            Doc<"deals">
        >();

        for (const deal of deals) {
            const currentDeal = bestDealByProductId.get(deal.productId);

            if (!currentDeal || deal.lowerBy > currentDeal.lowerBy) {
                bestDealByProductId.set(deal.productId, deal);
            }
        }

        const candidates = await getFunc1(
            ctx,
            [...bestDealByProductId.keys()],
            resultLimit * CANDIDATE_MULTIPLIER,
        );
        const evaluatedCandidates = candidates.map(candidate => {
            const match = getFunc2(candidate.ingredients, candidate.matchedProductIds);
            let thrift = 0;

            for (const ingredients of match.groupsMap.values()) {
                let bestGroupDiscount = 0;

                for (const ingredient of ingredients) {
                    const deal = bestDealByProductId.get(ingredient.productId);

                    if (deal && deal.lowerBy > bestGroupDiscount) {
                        bestGroupDiscount = deal.lowerBy;
                    }
                }

                thrift += bestGroupDiscount;
            }

            return {candidate, match, thrift};
        });

        evaluatedCandidates.sort((first, second) => {
            if (second.match.matchPercentage !== first.match.matchPercentage) {
                return second.match.matchPercentage - first.match.matchPercentage;
            }

            return second.thrift - first.thrift;
        });

        return await Promise.all(
            evaluatedCandidates
                .slice(0, resultLimit)
                .map(async ({candidate, match, thrift}) => {
                    const media = await getRecipeMedia(ctx, candidate.recipe);

                    return {
                        recipe: {...candidate.recipe, ...media},
                        missingGroups: match.missingGroups,
                        requiredGroups: match.requiredGroups,
                        source: "deals" as const,
                        matchedGroups: match.matchedGroups,
                        thrift,
                        matchPercentage: match.matchPercentage,
                        dealProductIds: [...candidate.matchedProductIds],
                        fridgeProductIds: [] as Id<"products">[],
                    };
                }),
        );
    },
});

export const getRecipesPaginated = query({
    args: {
        paginationOpts: paginationOptsValidator,
        excludedRecipeIds: v.array(v.id("recipes")),
    },
    handler: async (ctx, args) => {
        const excludedRecipeIds = new Set(args.excludedRecipeIds);
        const page = await ctx.db
            .query("recipes")
            .order("desc")
            .paginate(args.paginationOpts);
        const recipes = page.page.filter(recipe =>
            !excludedRecipeIds.has(recipe._id),
        );
        const result = await Promise.all(
            recipes.map(async recipe => {
                const media = await getRecipeMedia(ctx, recipe);

                return {
                    recipe: {...recipe, ...media},
                    source: "standard" as const,
                    dealProductIds: [] as Id<"products">[],
                    fridgeProductIds: [] as Id<"products">[],
                };
            }),
        );

        return {
            ...page,
            page: result,
        };
    },
});

async function getRecipeMedia(ctx: QueryCtx, recipe: Doc<"recipes">) {
    const imageUrls = await Promise.all(
        recipe.images.map(imageId => ctx.storage.getUrl(imageId)),
    );
    const images = imageUrls.filter((url): url is string => url !== null);
    const videoKey = recipe.videoKey
        ? `${process.env.R2_PUBLIC_URL}/${recipe.videoKey}`
        : undefined;

    return {images, videoKey};
}

async function getFunc1(ctx: QueryCtx, productIds: Id<"products">[], candidateLimit: number): Promise<RecipeCandidate[]> {
    const uniqueProductIds = [...new Set(productIds)];

    if (uniqueProductIds.length === 0 || candidateLimit <= 0) {
        return [];
    }

    const matchingIngredients = (
        await Promise.all(
            uniqueProductIds.map(productId =>
                ctx.db
                    .query("ingredients")
                    .withIndex("by_productId", index => index.eq("productId", productId))
                    .collect(),
            ),
        )
    ).flat();
    const matchedProductIdsByRecipe = new Map<
        Id<"recipes">,
        Set<Id<"products">>
    >();
    const matchedGroupsByRecipe = new Map<
        Id<"recipes">,
        Set<number>
    >();

    for (const ingredient of matchingIngredients) {
        const matchedProductIds =
            matchedProductIdsByRecipe.get(ingredient.recipeId) ?? new Set<Id<"products">>();
        const matchedGroups =
            matchedGroupsByRecipe.get(ingredient.recipeId) ?? new Set<number>();

        matchedProductIds.add(ingredient.productId);
        matchedGroups.add(ingredient.substitutionGroup);
        matchedProductIdsByRecipe.set(ingredient.recipeId, matchedProductIds);
        matchedGroupsByRecipe.set(ingredient.recipeId, matchedGroups);
    }

    const selectedRecipeIds = [...matchedGroupsByRecipe.entries()]
        .sort((first, second) => second[1].size - first[1].size)
        .slice(0, candidateLimit)
        .map(([recipeId]) => recipeId);
    const candidates = await Promise.all(
        selectedRecipeIds.map(async recipeId => {
            const [recipe, ingredients] = await Promise.all([
                ctx.db.get(recipeId),
                ctx.db
                    .query("ingredients")
                    .withIndex("by_recipeId", index => index.eq("recipeId", recipeId))
                    .collect(),
            ]);

            if (!recipe) {
                return null;
            }

            return {
                recipe,
                ingredients,
                matchedProductIds: matchedProductIdsByRecipe.get(recipeId) ?? new Set<Id<"products">>(),
            };
        }),
    );

    return candidates.filter(
        (candidate): candidate is RecipeCandidate => candidate !== null,
    );
}

function getFunc2(ingredients: Doc<"ingredients">[], matchedProductIds: ReadonlySet<Id<"products">>,): RecipeMatch {
    const groupsMap = groupIngredients(ingredients);
    const missingGroups: Doc<"ingredients">[] = [];
    let matchedGroups = 0;

    for (const group of groupsMap.values()) {
        const hasMatch = group.some(ingredient =>
            matchedProductIds.has(ingredient.productId),
        );

        if (hasMatch) {
            matchedGroups += 1;
        } else {
            const defaultIngredient = group.reduce((best, ingredient) => {
                return ingredient.groupLevel < best.groupLevel ? ingredient : best;
            });

            missingGroups.push(defaultIngredient);
        }
    }

    const requiredGroups = groupsMap.size;
    const matchPercentage = requiredGroups === 0
        ? 0
        : Math.round((matchedGroups / requiredGroups) * 100);

    return {
        groupsMap,
        missingGroups,
        requiredGroups,
        matchedGroups,
        matchPercentage,
    };
}

function groupIngredients(ingredients: Doc<"ingredients">[]) {
    const groupsMap = new Map<number, Doc<"ingredients">[]>();

    for (const ingredient of ingredients) {
        const group = groupsMap.get(ingredient.substitutionGroup) ?? [];
        group.push(ingredient);
        groupsMap.set(ingredient.substitutionGroup, group);
    }

    return groupsMap;
}

function normalizeLimit(requestedLimit: number | undefined, defaultLimit: number, maximumLimit: number) {
    if (requestedLimit === undefined || !Number.isFinite(requestedLimit)) {
        return defaultLimit;
    }

    return Math.min(
        Math.max(Math.floor(requestedLimit), 1),
        maximumLimit,
    );
}
