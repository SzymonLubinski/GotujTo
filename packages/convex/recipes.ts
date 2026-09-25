// noinspection JSUnusedGlobalSymbols

import {
    internalMutation,
    mutation,
    query,
    MutationCtx,
    type QueryCtx,
} from "./_generated/server";
import {ConvexError, v} from "convex/values";
import {paginationOptsValidator} from "convex/server";
import {filter} from "convex-helpers/server/filter";
import {type Doc, type Id} from "./_generated/dataModel";
import {customaryUnits, dietTypes, mealTypes, metricUnits, occasions, stores} from "../shared/data/stableData";
import {requireAdmin} from "./lib/requireAdmin";
import {internal} from "./_generated/api";

const DEFAULT_DEALS_LIMIT = 30;
const MAX_DEALS_LIMIT = 30;
const DEFAULT_FRIDGE_LIMIT = 30;
const MAX_FRIDGE_LIMIT = 30;
const BACKFILL_BATCH_SIZE = 25;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

const allowedImageTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
]);

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
    recipeId: Id<"recipes">;
    matchedProductIds: Set<Id<"products">>;
    matchedGroups: Set<number>;
    requiredGroups: number;
    matchPercentage: number;
    thrift: number;
};

type RecipeCandidateWithDetails = RecipeCandidate & {
    recipe: Doc<"recipes">;
    ingredients: Doc<"ingredients">[];
};

type RecipeMatch = {
    groupsMap: Map<number, Doc<"ingredients">[]>;
    missingGroups: Doc<"ingredients">[];
    requiredGroups: number;
    matchedGroups: number;
    matchPercentage: number;
};

export const searchRecipesForAdmin = query({
    args: {
        adminSecret: v.string(),
        phrase: v.string(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        requireAdmin(args.adminSecret);

        const phrase = args.phrase.trim();

        if (phrase.length < 2) {
            return [];
        }

        const limit = Math.min(
            Math.max(
                Math.floor(args.limit ?? 50),
                1,
            ),
            50,
        );

        return await ctx.db
            .query("recipes")
            .withSearchIndex(
                "by_name_prefix",
                query =>
                    query.search("name", phrase),
            )
            .take(limit);
    },
});

export const createRecipe = mutation({
    args: {
        adminSecret: v.string(),
        step1: recipeFieldsV,
        step2: ingredientGroupsV,
        step3: recipeStepsV,
    },
    handler: async (ctx, args) => {
        requireAdmin(args.adminSecret);
        await validateStoredImages(
            ctx,
            args.step1.images,
        );
        try {
            const recipeId = await ctx.db.insert("recipes", {
                authorId: "David",
                authorName: "David",
                favorite: 0,
                requiredIngredientGroups: args.step2.length,
                ...args.step1,
            });

            await ctx.db.patch(recipeId, {
                feedRank: getFeedRank(recipeId),
            });

            const ingredients = args.step2.flatMap((group, groupIndex) => {
                const mainIngredient = {
                    recipeId,
                    ...group.main,
                    substitutionGroup: groupIndex,
                    groupLevel: 0,
                    requiredIngredientGroups: args.step2.length,
                };
                const substitutes = group.substitutes.map((substitute, substituteIndex) => ({
                    recipeId,
                    ...substitute,
                    substitutionGroup: groupIndex,
                    groupLevel: substituteIndex + 1,
                    requiredIngredientGroups: args.step2.length,
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
        adminSecret: v.string(),
        step1: recipeFieldsV,
        step2: ingredientGroupsV,
        step3: recipeStepsV,
    },
    handler: async (ctx, args) => {
        requireAdmin(args.adminSecret);
        await validateStoredImages(
            ctx,
            args.step1.images,
        );
        const recipe = await ctx.db.get(args.recipeId);

        if (!recipe) {
            throw new ConvexError({code: "RECIPE_NOT_FOUND", message: "Nie znaleziono przepisu."});
        }

        const [ingredients, steps] = await Promise.all([
            ctx.db.query("ingredients").withIndex("by_recipeId", index => index.eq("recipeId", args.recipeId)).collect(),
            ctx.db.query("steps").withIndex("by_recipeId", index => index.eq("recipeId", args.recipeId)).collect(),
        ]);

        await ctx.db.patch(args.recipeId, {
            ...args.step1,
            requiredIngredientGroups: args.step2.length,
        });
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
                requiredIngredientGroups: args.step2.length,
            },
            ...group.substitutes.map((substitute, substituteIndex) => ({
                recipeId: args.recipeId,
                ...substitute,
                substitutionGroup: groupIndex,
                groupLevel: substituteIndex + 1,
                requiredIngredientGroups: args.step2.length,
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
    args: {
        adminSecret: v.string()
    },
    handler: async (ctx, args) => {
        requireAdmin(args.adminSecret);
        return await ctx.storage.generateUploadUrl();
    },
});

async function validateStoredImages(
    ctx: MutationCtx,
    imageIds: Id<"_storage">[],
) {
    for (const storageId of imageIds) {
        const metadata = await ctx.db.system.get(
            "_storage",
            storageId,
        );

        if (!metadata) {
            throw new ConvexError(
                "Nie znaleziono przesłanego zdjęcia.",
            );
        }

        if (metadata.size > MAX_IMAGE_SIZE) {
            throw new ConvexError(
                "Zdjęcie może mieć maksymalnie 10 MB.",
            );
        }

        if (
            !metadata.contentType ||
            !allowedImageTypes.has(
                metadata.contentType,
            )
        ) {
            throw new ConvexError(
                "Dozwolone formaty zdjęć: JPG, PNG i WebP.",
            );
        }
    }
}

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
        const candidates = await getRecipeCandidates(
            ctx,
            args.productIds,
        );
        candidates.sort(compareRecipeCandidates);
        const selectedCandidates = await getCandidateDetails(
            ctx,
            candidates.slice(0, resultLimit),
        );
        const evaluatedCandidates = selectedCandidates.map(candidate => ({
            candidate,
            match: getFunc2(
                candidate.ingredients,
                candidate.matchedProductIds,
            ),
        }));
        const missingProductIds = [
            ...new Set(
                evaluatedCandidates.flatMap(({match}) =>
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
            evaluatedCandidates.map(async ({candidate, match}) => {
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
        asOf: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const asOf = args.asOf ?? Date.now();
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
                        .withIndex("by_store_endsAt", index =>
                            index
                                .eq("store", store)
                                .gt("endsAt", asOf),
                        )
                        .filter(query =>
                            query.lte(
                                query.field("startsAt"),
                                asOf,
                            ),
                        )
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

            if (
                !currentDeal ||
                (deal.lowerBy ?? 0) >
                (currentDeal.lowerBy ?? 0)
            ) {
                bestDealByProductId.set(deal.productId, deal);
            }
        }

        const candidates = await getRecipeCandidates(
            ctx,
            [...bestDealByProductId.keys()],
            new Map(
                [...bestDealByProductId.entries()].map(
                    ([productId, deal]) => [
                        productId,
                        deal.lowerBy ?? 0,
                    ],
                ),
            ),
        );
        candidates.sort(compareRecipeCandidates);
        const selectedCandidates = await getCandidateDetails(
            ctx,
            candidates.slice(0, resultLimit),
        );
        const evaluatedCandidates = selectedCandidates.map(candidate => ({
            candidate,
            match: getFunc2(
                candidate.ingredients,
                candidate.matchedProductIds,
            ),
        }));

        return await Promise.all(
            evaluatedCandidates
                .map(async ({candidate, match}) => {
                    const media = await getRecipeMedia(ctx, candidate.recipe);

                    return {
                        recipe: {...candidate.recipe, ...media},
                        missingGroups: match.missingGroups,
                        requiredGroups: match.requiredGroups,
                        source: "deals" as const,
                        matchedGroups: match.matchedGroups,
                        thrift: candidate.thrift,
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
        randomSeed: v.string(),
        createdBefore: v.number(),
    },
    handler: async (ctx, args) => {
        const excludedRecipeIds =
            new Set(args.excludedRecipeIds);

        // Istniejące przepisy nie mają feedRank do czasu zakończenia migracji.
        // Ten wariant zachowuje działający feed lokalnie i po wdrożeniu schematu,
        // a po backfillu cała baza przejdzie na szybki indeks by_feedRank.
        const hasRankedRecipe = await ctx.db
            .query("recipes")
            .withIndex("by_feedRank", index =>
                index.gte("feedRank", 0),
            )
            .first();

        if (!hasRankedRecipe) {
            const orderedRecipes = (await ctx.db
                .query("recipes")
                .collect())
                .filter(recipe =>
                    recipe._creationTime <= args.createdBefore &&
                    !excludedRecipeIds.has(recipe._id),
                )
                .sort((first, second) => {
                    const firstScore = getSeededScore(
                        args.randomSeed,
                        first._id,
                    );
                    const secondScore = getSeededScore(
                        args.randomSeed,
                        second._id,
                    );

                    if (firstScore !== secondScore) {
                        return firstScore - secondScore;
                    }

                    return first._id < second._id ? -1 : 1;
                });

            const parsedOffset = args.paginationOpts.cursor
                ? Number.parseInt(args.paginationOpts.cursor, 10)
                : 0;
            const offset =
                Number.isSafeInteger(parsedOffset) && parsedOffset >= 0
                    ? parsedOffset
                    : 0;
            const legacyPageRecipes = orderedRecipes.slice(
                offset,
                offset + args.paginationOpts.numItems,
            );
            const page = await Promise.all(
                legacyPageRecipes.map(async recipe => ({
                    recipe: {
                        ...recipe,
                        ...await getRecipeMedia(ctx, recipe),
                    },
                    source: "standard" as const,
                    dealProductIds: [] as Id<"products">[],
                    fridgeProductIds: [] as Id<"products">[],
                })),
            );

            return {
                page,
                isDone: offset + legacyPageRecipes.length >= orderedRecipes.length,
                continueCursor: String(offset + legacyPageRecipes.length),
            };
        }

        const pageRecipes = await ctx.db
            .query("recipes")
            .withIndex("by_feedRank", index =>
                index.gte("feedRank", 0),
            )
            .filter(query =>
                query.and(
                    query.lte(
                        query.field("_creationTime"),
                        args.createdBefore,
                    ),
                    ...[...excludedRecipeIds].map(recipeId =>
                        query.neq(query.field("_id"), recipeId),
                    ),
                ),
            )
            .paginate(args.paginationOpts);

        const page = await Promise.all(
            pageRecipes.page.map(async recipe => {
                const media =
                    await getRecipeMedia(ctx, recipe);

                return {
                    recipe: {
                        ...recipe,
                        ...media,
                    },
                    source: "standard" as const,
                    dealProductIds:
                        [] as Id<"products">[],
                    fridgeProductIds:
                        [] as Id<"products">[],
                };
            }),
        );

        return {
            page,
            isDone: pageRecipes.isDone,
            continueCursor: pageRecipes.continueCursor,
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

async function getRecipeCandidates(
    ctx: QueryCtx,
    productIds: Id<"products">[],
    discountsByProductId?: ReadonlyMap<Id<"products">, number>,
): Promise<RecipeCandidate[]> {
    const uniqueProductIds = [...new Set(productIds)];

    if (uniqueProductIds.length === 0) {
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
    const candidatesByRecipeId = new Map<
        Id<"recipes">,
        {
            matchedProductIds: Set<Id<"products">>;
            matchedGroups: Set<number>;
            requiredGroups: number;
            discountsByGroup: Map<number, number>;
        }
    >();

    for (const ingredient of matchingIngredients) {
        const candidate = candidatesByRecipeId.get(ingredient.recipeId) ?? {
            matchedProductIds: new Set<Id<"products">>(),
            matchedGroups: new Set<number>(),
            requiredGroups: 0,
            discountsByGroup: new Map<number, number>(),
        };

        candidate.matchedProductIds.add(ingredient.productId);
        candidate.matchedGroups.add(ingredient.substitutionGroup);
        candidate.requiredGroups = Math.max(
            candidate.requiredGroups,
            ingredient.requiredIngredientGroups ?? 0,
        );

        const discount = discountsByProductId?.get(ingredient.productId) ?? 0;
        const currentGroupDiscount = candidate.discountsByGroup.get(
            ingredient.substitutionGroup,
        ) ?? 0;
        candidate.discountsByGroup.set(
            ingredient.substitutionGroup,
            Math.max(currentGroupDiscount, discount),
        );
        candidatesByRecipeId.set(ingredient.recipeId, candidate);
    }

    return [...candidatesByRecipeId.entries()].flatMap(
        ([recipeId, candidate]) => {
            if (candidate.requiredGroups === 0) {
                return [];
            }

            return [{
                recipeId,
                matchedProductIds: candidate.matchedProductIds,
                matchedGroups: candidate.matchedGroups,
                requiredGroups: candidate.requiredGroups,
                matchPercentage: Math.round(
                    (candidate.matchedGroups.size / candidate.requiredGroups) * 100,
                ),
                thrift: [...candidate.discountsByGroup.values()]
                    .reduce((total, discount) => total + discount, 0),
            }];
        },
    );
}

async function getCandidateDetails(
    ctx: QueryCtx,
    candidates: RecipeCandidate[],
): Promise<RecipeCandidateWithDetails[]> {
    const candidatesWithDetails = await Promise.all(
        candidates.map(async candidate => {
            const [recipe, ingredients] = await Promise.all([
                ctx.db.get(candidate.recipeId),
                ctx.db
                    .query("ingredients")
                    .withIndex("by_recipeId", index =>
                        index.eq("recipeId", candidate.recipeId),
                    )
                    .collect(),
            ]);

            return recipe
                ? {...candidate, recipe, ingredients}
                : null;
        }),
    );

    return candidatesWithDetails.filter(
        (candidate): candidate is RecipeCandidateWithDetails => candidate !== null,
    );
}

function compareRecipeCandidates(
    first: RecipeCandidate,
    second: RecipeCandidate,
) {
    if (second.matchPercentage !== first.matchPercentage) {
        return second.matchPercentage - first.matchPercentage;
    }

    if (second.matchedGroups.size !== first.matchedGroups.size) {
        return second.matchedGroups.size - first.matchedGroups.size;
    }

    if (second.thrift !== first.thrift) {
        return second.thrift - first.thrift;
    }

    return first.recipeId < second.recipeId ? -1 : 1;
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

export const getRecipesForSitemap = query({
    args: {},
    handler: async ctx => {
        const recipes = await ctx.db
            .query("recipes")
            .collect();

        return recipes.map(recipe => ({
            recipeId: recipe._id,
            createdAt: recipe._creationTime,
        }));
    },
});

export const startBackfillFeedMetadata = mutation({
    args: {
        adminSecret: v.string(),
    },
    handler: async (ctx, args) => {
        requireAdmin(args.adminSecret);

        await ctx.scheduler.runAfter(
            0,
            internal.recipes.backfillFeedMetadataBatch,
            {cursor: null},
        );

        return {started: true};
    },
});

export const backfillFeedMetadataBatch = internalMutation({
    args: {
        cursor: v.union(v.string(), v.null()),
    },
    handler: async (ctx, args) => {
        const page = await ctx.db
            .query("recipes")
            .paginate({
                cursor: args.cursor,
                numItems: BACKFILL_BATCH_SIZE,
            });

        await Promise.all(
            page.page.map(async recipe => {
                const ingredients = await ctx.db
                    .query("ingredients")
                    .withIndex("by_recipeId", index =>
                        index.eq("recipeId", recipe._id),
                    )
                    .collect();
                const requiredIngredientGroups = new Set(
                    ingredients.map(ingredient => ingredient.substitutionGroup),
                ).size;

                await Promise.all([
                    ctx.db.patch(recipe._id, {
                        feedRank: recipe.feedRank ?? getFeedRank(recipe._id),
                        requiredIngredientGroups,
                    }),
                    ...ingredients
                        .filter(ingredient =>
                            ingredient.requiredIngredientGroups !==
                            requiredIngredientGroups,
                        )
                        .map(ingredient =>
                            ctx.db.patch(ingredient._id, {
                                requiredIngredientGroups,
                            }),
                        ),
                ]);
            }),
        );

        if (!page.isDone) {
            await ctx.scheduler.runAfter(
                0,
                internal.recipes.backfillFeedMetadataBatch,
                {cursor: page.continueCursor},
            );
        }

        return {
            updatedRecipes: page.page.length,
            isDone: page.isDone,
        };
    },
});

function getFeedRank(recipeId: Id<"recipes">) {
    return getSeededScore("feed-rank", recipeId);
}

function getSeededScore(
    seed: string,
    recipeId: Id<"recipes">,
) {
    const value = `${seed}:${recipeId}`;
    let hash = 2166136261;

    for (let index = 0; index < value.length; index++) {
        hash ^= value.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }

    return hash >>> 0;
}

export const deleteRecipe = mutation({
    args: {
        recipeId: v.id("recipes"),
        adminSecret: v.string(),
    },
    handler: async (ctx, args) => {
        requireAdmin(args.adminSecret);

        const recipe = await ctx.db.get(args.recipeId);

        if (!recipe) {
            throw new ConvexError({
                code: "RECIPE_NOT_FOUND",
                message: "Nie znaleziono przepisu.",
            });
        }

        const [ingredients, steps] = await Promise.all([
            ctx.db
                .query("ingredients")
                .withIndex("by_recipeId", index => index.eq("recipeId", args.recipeId))
                .collect(),
            ctx.db
                .query("steps")
                .withIndex("by_recipeId", index => index.eq("recipeId", args.recipeId))
                .collect(),
        ]);

        await Promise.all([
            ...ingredients.map(ingredient => ctx.db.delete(ingredient._id)),
            ...steps.map(step => ctx.db.delete(step._id)),
            ...recipe.images.map(imageId => ctx.storage.delete(imageId)),
        ]);

        await ctx.db.delete(args.recipeId);

        return {
            recipeId: args.recipeId,
            videoKey: recipe.videoKey ?? null,
        };
    },
});
