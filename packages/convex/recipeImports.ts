import {v} from "convex/values";
import {
    action,
    internalMutation,
    internalQuery,
    mutation,
    query,
} from "./_generated/server";
import {internal} from "./_generated/api";
import {type Doc, type Id} from "./_generated/dataModel";
import {
    customaryUnits,
    dietTypes,
    mealTypes,
    metricUnits,
    occasions,
} from "../shared/data/stableData";

const reviewStatus = v.union(
    v.literal("raw"),
    v.literal("postponed"),
    v.literal("error"),
);

const nullableMetricUnit = v.union(
    v.null(),
    ...metricUnits.map(unit => v.literal(unit)),
);

const nullableCustomaryUnit = v.union(
    v.null(),
    ...customaryUnits.map(unit => v.literal(unit)),
);

const recipeDraft = v.object({
    name: v.union(v.string(), v.null()),
    description: v.union(v.string(), v.null()),
    cookingMinutes: v.union(v.number(), v.null()),
    servings: v.union(v.number(), v.null()),
    authorName: v.string(),
    diets: v.array(v.union(...dietTypes.map(diet => v.literal(diet)))),
    types: v.array(v.union(...mealTypes.map(type => v.literal(type)))),
    occasions: v.array(v.union(...occasions.map(occasion => v.literal(occasion)))),
});

const ingredientDraft = v.object({
    ingredientImportId: v.id("ingredientsImports"),
    translatedProductName: v.union(v.string(), v.null()),
    productId: v.union(v.id("products"), v.null()),
    substitutionGroup: v.number(),
    groupLevel: v.number(),
    metricUnit: nullableMetricUnit,
    customaryUnit: nullableCustomaryUnit,
    metricQuantity: v.union(v.number(), v.null()),
    customaryQuantity: v.union(v.number(), v.null()),
    optional: v.boolean(),
});

const stepDraft = v.object({
    stepImportId: v.id("stepsImports"),
    stepNum: v.number(),
    description: v.union(v.string(), v.null()),
});

type ApprovalData = {
    recipe: Doc<"recipeImports">;
    ingredients: Doc<"ingredientsImports">[];
    steps: Doc<"stepsImports">[];
};

export const getNextForReview = query({
    args: {
        status: reviewStatus,
        excludedIds: v.array(v.id("recipeImports")),
    },
    handler: async (ctx, args) => {
        const excludedIds = new Set(args.excludedIds);
        const recipes = await ctx.db
            .query("recipeImports")
            .withIndex("by_status", index => index.eq("status", args.status))
            .order("asc")
            .take(args.excludedIds.length + 1);

        const recipe = recipes.find(item => !excludedIds.has(item._id));

        if (!recipe) {
            return null;
        }

        const [ingredients, steps] = await Promise.all([
            ctx.db
                .query("ingredientsImports")
                .withIndex("by_recipeImportId", index =>
                    index.eq("recipeImportId", recipe._id),
                )
                .collect(),
            ctx.db
                .query("stepsImports")
                .withIndex("by_recipeImportId", index =>
                    index.eq("recipeImportId", recipe._id),
                )
                .collect(),
        ]);

        return {
            recipe,
            ingredients: ingredients.sort(
                (first, second) => first.sourcePosition - second.sourcePosition,
            ),
            steps: steps.sort((first, second) => first.stepNum - second.stepNum),
        };
    },
});

export const saveDraft = mutation({
    args: {
        recipeImportId: v.id("recipeImports"),
        recipe: recipeDraft,
        ingredients: v.array(ingredientDraft),
        steps: v.array(stepDraft),
    },
    handler: async (ctx, args) => {
        const recipeImport = await ctx.db.get(args.recipeImportId);

        if (!recipeImport) {
            throw new Error("Nie znaleziono importowanego przepisu.");
        }

        if (recipeImport.status === "success") {
            throw new Error("Ten przepis został już zatwierdzony.");
        }

        const ingredientDocuments = await Promise.all(
            args.ingredients.map(ingredient =>
                ctx.db.get(ingredient.ingredientImportId),
            ),
        );
        const stepDocuments = await Promise.all(
            args.steps.map(step => ctx.db.get(step.stepImportId)),
        );

        if (ingredientDocuments.some(
            ingredient =>
                !ingredient || ingredient.recipeImportId !== args.recipeImportId,
        )) {
            throw new Error("Co najmniej jeden składnik nie należy do tego importu.");
        }

        if (stepDocuments.some(
            step => !step || step.recipeImportId !== args.recipeImportId,
        )) {
            throw new Error("Co najmniej jeden krok nie należy do tego importu.");
        }

        await ctx.db.patch(args.recipeImportId, {
            ...args.recipe,
            error: null,
            updatedAt: Date.now(),
        });

        await Promise.all(args.ingredients.map(ingredient => {
            const {ingredientImportId, ...values} = ingredient;

            return ctx.db.patch(ingredientImportId, {
                ...values,
                status: values.productId === null ? "needsReview" : "matched",
            });
        }));

        await Promise.all(args.steps.map(step => {
            const {stepImportId, ...values} = step;
            return ctx.db.patch(stepImportId, values);
        }));
    },
});

export const postpone = mutation({
    args: {recipeImportId: v.id("recipeImports")},
    handler: async (ctx, args) => {
        const recipeImport = await ctx.db.get(args.recipeImportId);

        if (!recipeImport) {
            throw new Error("Nie znaleziono importowanego przepisu.");
        }

        if (recipeImport.status === "success") {
            throw new Error("Ten przepis został już zatwierdzony.");
        }

        await ctx.db.patch(args.recipeImportId, {
            status: "postponed",
            error: null,
            updatedAt: Date.now(),
        });
    },
});

export const getApprovalData = internalQuery({
    args: {recipeImportId: v.id("recipeImports")},
    handler: async (ctx, args): Promise<ApprovalData | null> => {
        const recipe = await ctx.db.get(args.recipeImportId);

        if (!recipe) {
            return null;
        }

        const [ingredients, steps] = await Promise.all([
            ctx.db
                .query("ingredientsImports")
                .withIndex("by_recipeImportId", index =>
                    index.eq("recipeImportId", args.recipeImportId),
                )
                .collect(),
            ctx.db
                .query("stepsImports")
                .withIndex("by_recipeImportId", index =>
                    index.eq("recipeImportId", args.recipeImportId),
                )
                .collect(),
        ]);

        return {recipe, ingredients, steps};
    },
});

export const finalizeApproval = internalMutation({
    args: {
        recipeImportId: v.id("recipeImports"),
        imageStorageId: v.id("_storage"),
    },
    handler: async (ctx, args): Promise<{
        recipeId: Id<"recipes">;
        usedProvidedImage: boolean;
    }> => {
        const recipeImport = await ctx.db.get(args.recipeImportId);

        if (!recipeImport) {
            throw new Error("Nie znaleziono importowanego przepisu.");
        }

        if (recipeImport.status === "success" && recipeImport.targetRecipeId) {
            return {
                recipeId: recipeImport.targetRecipeId,
                usedProvidedImage: recipeImport.imageStorageId === args.imageStorageId,
            };
        }

        const [ingredients, steps] = await Promise.all([
            ctx.db
                .query("ingredientsImports")
                .withIndex("by_recipeImportId", index =>
                    index.eq("recipeImportId", args.recipeImportId),
                )
                .collect(),
            ctx.db
                .query("stepsImports")
                .withIndex("by_recipeImportId", index =>
                    index.eq("recipeImportId", args.recipeImportId),
                )
                .collect(),
        ]);

        const recipe = requireCompleteRecipe(recipeImport);
        const completeIngredients = requireCompleteIngredients(ingredients);
        const completeSteps = requireCompleteSteps(steps);

        const products = await Promise.all(
            completeIngredients.map(ingredient => ctx.db.get(ingredient.productId)),
        );

        if (products.some(product => product === null)) {
            throw new Error("Co najmniej jeden przypisany produkt nie istnieje.");
        }

        const recipeId = await ctx.db.insert("recipes", {
            name: recipe.name,
            description: recipe.description ?? undefined,
            cookingMinutes: recipe.cookingMinutes,
            servings: recipe.servings,
            authorId: recipe.authorId,
            favorite: recipe.favorite,
            images: [args.imageStorageId],
            videoKey: recipe.videoKey ?? undefined,
            diets: recipe.diets,
            types: recipe.types,
            occasions: recipe.occasions,
            authorName: "TheMealDB"
        });

        await Promise.all(completeIngredients.map(ingredient =>
            ctx.db.insert("ingredients", {
                recipeId,
                productId: ingredient.productId,
                substitutionGroup: ingredient.substitutionGroup,
                groupLevel: ingredient.groupLevel,
                metricUnit: ingredient.metricUnit,
                customaryUnit: ingredient.customaryUnit,
                metricQuantity: ingredient.metricQuantity,
                customaryQuantity: ingredient.customaryQuantity,
                optional: ingredient.optional,
            }),
        ));

        await Promise.all(completeSteps.map(step =>
            ctx.db.insert("steps", {
                recipeId,
                stepNum: step.stepNum,
                description: step.description,
            }),
        ));

        await Promise.all([
            ...ingredients.map(ingredient => ctx.db.delete(ingredient._id)),
            ...steps.map(step => ctx.db.delete(step._id)),
        ]);

        await ctx.db.patch(args.recipeImportId, {
            status: "success",
            imageStorageId: args.imageStorageId,
            targetRecipeId: recipeId,
            importedAt: Date.now(),
            updatedAt: Date.now(),
            error: null,
        });

        return {recipeId, usedProvidedImage: true};
    },
});

export const markImportError = internalMutation({
    args: {
        recipeImportId: v.id("recipeImports"),
        error: v.string(),
    },
    handler: async (ctx, args) => {
        const recipeImport = await ctx.db.get(args.recipeImportId);

        if (!recipeImport || recipeImport.status === "success") {
            return;
        }

        await ctx.db.patch(args.recipeImportId, {
            status: "error",
            error: args.error,
            updatedAt: Date.now(),
        });
    },
});

export const approve = action({
    args: {recipeImportId: v.id("recipeImports")},
    handler: async (ctx, args): Promise<{recipeId: Id<"recipes">}> => {
        let newlyStoredImageId: Id<"_storage"> | null = null;

        try {
            const data: ApprovalData | null = await ctx.runQuery(
                internal.recipeImports.getApprovalData,
                args,
            );

            if (!data) {
                throw new Error("Nie znaleziono importowanego przepisu.");
            }

            if (data.recipe.status === "success" && data.recipe.targetRecipeId) {
                return {recipeId: data.recipe.targetRecipeId};
            }

            validateApprovalData(data);

            let imageStorageId = data.recipe.imageStorageId;

            if (!imageStorageId) {
                const imageUrl = data.recipe.imageUrl;

                if (!imageUrl) {
                    throw new Error("Przepis nie ma zdjęcia.");
                }

                const response = await fetch(imageUrl);

                if (!response.ok) {
                    throw new Error(
                        `Nie udało się pobrać zdjęcia (${response.status}).`,
                    );
                }

                const image = await response.blob();
                const contentType = response.headers.get("content-type") ?? image.type;

                if (!contentType.startsWith("image/")) {
                    throw new Error("Pobrany plik nie jest obrazem.");
                }

                if (image.size > 10 * 1024 * 1024) {
                    throw new Error("Zdjęcie przekracza limit 10 MB.");
                }

                newlyStoredImageId = await ctx.storage.store(image);
                imageStorageId = newlyStoredImageId;
            }

            const result: {
                recipeId: Id<"recipes">;
                usedProvidedImage: boolean;
            } = await ctx.runMutation(
                internal.recipeImports.finalizeApproval,
                {recipeImportId: args.recipeImportId, imageStorageId},
            );

            if (newlyStoredImageId && !result.usedProvidedImage) {
                await ctx.storage.delete(newlyStoredImageId);
            }

            return {recipeId: result.recipeId};
        } catch (error) {
            if (newlyStoredImageId) {
                await ctx.storage.delete(newlyStoredImageId).catch(() => undefined);
            }

            const message = getErrorMessage(error);

            await ctx.runMutation(internal.recipeImports.markImportError, {
                recipeImportId: args.recipeImportId,
                error: message,
            });

            throw new Error(message);
        }
    },
});

function requireCompleteRecipe(recipe: Doc<"recipeImports">) {
    if (!recipe.name?.trim()) {
        throw new Error("Uzupełnij nazwę przepisu.");
    }

    if (recipe.cookingMinutes === null || recipe.cookingMinutes <= 0) {
        throw new Error("Czas przygotowania musi być większy od zera.");
    }

    if (recipe.servings === null || recipe.servings <= 0) {
        throw new Error("Liczba porcji musi być większa od zera.");
    }

    return {
        ...recipe,
        name: recipe.name.trim(),
        cookingMinutes: recipe.cookingMinutes,
        servings: recipe.servings,
    };
}

function requireCompleteIngredients(ingredients: Doc<"ingredientsImports">[]) {
    if (ingredients.length === 0) {
        throw new Error("Przepis nie ma składników.");
    }

    return ingredients.map((ingredient, index) => {
        if (!ingredient.productId) {
            const ingredientName =
                ingredient.translatedProductName?.trim() ||
                ingredient.sourceIngredient?.trim() ||
                `nr ${index + 1}`;

            throw new Error(
                `Składnik „${ingredientName}” nie ma przypisanego produktu.`,
            );
        }

        if (ingredient.metricUnit === null || ingredient.metricQuantity === null) {
            throw new Error(`Składnik ${index + 1} nie ma jednostki metrycznej.`);
        }

        if (
            ingredient.customaryUnit === null ||
            ingredient.customaryQuantity === null
        ) {
            throw new Error(`Składnik ${index + 1} nie ma jednostki użytkowej.`);
        }

        if (ingredient.metricQuantity <= 0 || ingredient.customaryQuantity <= 0) {
            throw new Error(`Ilość składnika ${index + 1} musi być większa od zera.`);
        }

        return {
            ...ingredient,
            productId: ingredient.productId,
            metricUnit: ingredient.metricUnit,
            customaryUnit: ingredient.customaryUnit,
            metricQuantity: ingredient.metricQuantity,
            customaryQuantity: ingredient.customaryQuantity,
        };
    });
}

function requireCompleteSteps(steps: Doc<"stepsImports">[]) {
    if (steps.length === 0) {
        throw new Error("Przepis nie ma kroków przygotowania.");
    }

    const sortedSteps = [...steps].sort(
        (first, second) => first.stepNum - second.stepNum,
    );

    return sortedSteps.map((step, index) => {
        if (!step.description?.trim()) {
            throw new Error(`Krok ${index + 1} nie ma opisu.`);
        }

        return {
            ...step,
            description: step.description.trim(),
        };
    });
}

function validateApprovalData(data: ApprovalData) {
    requireCompleteRecipe(data.recipe);
    requireCompleteIngredients(data.ingredients);
    requireCompleteSteps(data.steps);
}

function getErrorMessage(error: unknown) {
    return error instanceof Error
        ? error.message
        : "Nie udało się zatwierdzić importowanego przepisu.";
}

export const addSubstitute = mutation({
    args: {
        recipeImportId: v.id("recipeImports"),
        substitutionGroup: v.number(),
    },
    handler: async (ctx, args) => {
        const recipeImport = await ctx.db.get(
            args.recipeImportId,
        );

        if (!recipeImport) {
            throw new Error(
                "Nie znaleziono importowanego przepisu.",
            );
        }

        if (recipeImport.status === "success") {
            throw new Error(
                "Nie można zmieniać opublikowanego przepisu.",
            );
        }

        const groupIngredients = await ctx.db
            .query("ingredientsImports")
            .withIndex("by_recipeImportId", index =>
                index.eq(
                    "recipeImportId",
                    args.recipeImportId,
                ),
            )
            .filter(filter =>
                filter.eq(
                    filter.field("substitutionGroup"),
                    args.substitutionGroup,
                ),
            )
            .collect();

        if (groupIngredients.length === 0) {
            throw new Error(
                "Nie znaleziono grupy składników.",
            );
        }

        const sourcePosition = Math.min(
            ...groupIngredients.map(
                ingredient => ingredient.sourcePosition,
            ),
        );

        const groupLevel =
            Math.max(
                ...groupIngredients.map(
                    ingredient => ingredient.groupLevel,
                ),
            ) + 1;

        const ingredientImportId = await ctx.db.insert(
            "ingredientsImports",
            {
                recipeImportId: args.recipeImportId,
                sourcePosition,
                sourceIngredient: "",
                sourceMeasure: "",
                translatedProductName: null,
                productId: null,
                substitutionGroup:
                args.substitutionGroup,
                groupLevel,
                metricUnit: null,
                customaryUnit: null,
                metricQuantity: null,
                customaryQuantity: null,
                optional: false,
                status: "needsReview",
            },
        );

        await ctx.db.patch(args.recipeImportId, {
            updatedAt: Date.now(),
        });

        return ingredientImportId;
    },
});

export const removeIngredient = mutation({
    args: {
        ingredientImportId: v.id(
            "ingredientsImports",
        ),
    },
    handler: async (ctx, args) => {
        const ingredient = await ctx.db.get(
            args.ingredientImportId,
        );

        if (!ingredient) {
            throw new Error(
                "Nie znaleziono składnika.",
            );
        }

        const recipeImport = await ctx.db.get(
            ingredient.recipeImportId,
        );

        if (!recipeImport) {
            throw new Error(
                "Nie znaleziono importowanego przepisu.",
            );
        }

        if (recipeImport.status === "success") {
            throw new Error(
                "Nie można zmieniać opublikowanego przepisu.",
            );
        }

        if (ingredient.groupLevel === 0) {
            throw new Error(
                "Nie można usunąć głównego składnika.",
            );
        }

        await ctx.db.delete(args.ingredientImportId);

        await ctx.db.patch(ingredient.recipeImportId, {
            updatedAt: Date.now(),
        });
    },
});