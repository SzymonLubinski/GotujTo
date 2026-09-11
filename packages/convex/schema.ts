import {defineSchema, defineTable} from "convex/server";
import {v} from "convex/values";
import {customaryUnits, dietTypes, productTypes, mealTypes, metricUnits, occasions, stores} from "../shared/data/stableData"

export default defineSchema({
    recipes: defineTable({
        name: v.string(),
        cookingMinutes: v.number(),
        servings: v.number(),
        authorId: v.string(),
        authorName: v.optional(v.string()),
        description: v.optional(v.string()),
        favorite: v.number(),
        images: v.array(v.id("_storage")),
        videoKey: v.optional(v.string()),
        diets: v.array(v.union(...dietTypes.map((type) => v.literal(type)))),
        types: v.array(v.union(...mealTypes.map((type) => v.literal(type)))),
        occasions: v.array(v.union(...occasions.map((occasion) => v.literal(occasion)))),
    }).index("by_name", ["name"])
        .searchIndex("by_name_prefix", {searchField: "name"}),

    steps: defineTable({
        recipeId: v.id("recipes"),
        stepNum: v.number(),
        description: v.string(),
    }).index('by_recipeId', ['recipeId']),

    products: defineTable({
        name: v.string(),
        image: v.optional(v.id("_storage")),
        type: v.union(...productTypes.map((type) => v.literal(type)))
    }).index("by_name", ["name"]).searchIndex("search_name", {searchField: 'name'}),

    ingredients: defineTable({
        recipeId: v.id("recipes"),
        productId: v.id("products"),
        substitutionGroup: v.number(),
        groupLevel: v.number(),
        metricUnit: v.union(...metricUnits.map((unit) => v.literal(unit))),
        customaryUnit: v.union(...customaryUnits.map((unit) => v.literal(unit))),
        metricQuantity: v.number(),
        customaryQuantity: v.number(),
        optional: v.boolean(),
    }).index('by_productId', ['productId']).index('by_recipeId', ['recipeId']),

    deals: defineTable({
        productId: v.id("products"),
        store: v.union(...stores.map((store) => v.literal(store))),
        dealPrice: v.number(),
        lowerBy: v.number(),
        regularPrice: v.optional(v.number()),
        startsAt: v.number(),
        endsAt: v.number(),
    }).index('by_store', ['store']),

    social: defineTable({
        title: v.string(),
        description: v.string(),
        instagramUrl: v.string(),
        facebookUrl: v.string(),
        active: v.boolean(),
    }),

    blog: defineTable({
        title: v.string(),
        description: v.string(),
        type: v.union(v.literal("tip"), v.literal("article"), v.literal("joke"),),
        images: v.array(v.id("_storage")),
        videoKey: v.optional(v.string()),
        active: v.boolean(),
        publishedAt: v.number(),
    }).index("by_active_publishedAt", ["active", "publishedAt"]),

    // TheMealDB wersja robocza
    recipeImports: defineTable({
        externalId: v.string(),
        source: v.literal("recipe-imports"),
        originalName: v.string(),
        name: v.union(v.string(), v.null()),
        cookingMinutes: v.union(v.number(), v.null()),
        servings: v.union(v.number(), v.null()),
        authorId: v.string(),
        authorName: v.optional(v.string()),
        description: v.union(v.string(), v.null()),
        favorite: v.number(),
        imageUrl: v.union(v.string(), v.null()),
        imageStorageId: v.union(v.id("_storage"), v.null()),
        videoKey: v.union(v.string(), v.null()),
        diets: v.array(v.union(...dietTypes.map((type) => v.literal(type)))),
        types: v.array(v.union(...mealTypes.map((type) => v.literal(type)))),
        occasions: v.array(v.union(...occasions.map((occasion) => v.literal(occasion)))),
        sourceUrl: v.union(v.string(), v.null()),
        youtubeUrl: v.union(v.string(), v.null()),
        sourceCategory: v.union(v.string(), v.null()),
        sourceArea: v.union(v.string(), v.null()),
        sourceTags: v.array(v.string()),
        creativeCommonsConfirmed: v.union(v.string(), v.null()),
        rawData: v.any(),
        status: v.union(
            v.literal("raw"),
            v.literal("postponed"),
            v.literal("success"),
            v.literal("error"),
        ),
        targetRecipeId: v.union(v.id("recipes"), v.null()),
        error: v.union(v.string(), v.null()),
        importedAt: v.union(v.number(), v.null()),
        updatedAt: v.number(),
    })
        .index("by_source_externalId", ["source", "externalId"])
        .index("by_status", ["status"]),

    ingredientsImports: defineTable({
        recipeImportId: v.id("recipeImports"),
        sourcePosition: v.number(),
        sourceIngredient: v.string(),
        sourceMeasure: v.string(),
        translatedProductName: v.union(v.string(), v.null()),
        productId: v.union(v.id("products"), v.null()),
        substitutionGroup: v.number(),
        groupLevel: v.number(),
        metricUnit: v.union(v.null(), ...metricUnits.map((unit) => v.literal(unit))),
        customaryUnit: v.union(v.null(), ...customaryUnits.map((unit) => v.literal(unit))),
        metricQuantity: v.union(v.number(), v.null()),
        customaryQuantity: v.union(v.number(), v.null()),
        optional: v.boolean(),
        status: v.union(
            v.literal("pending"),
            v.literal("matched"),
            v.literal("needsReview"),
        ),
    })
        .index("by_recipeImportId", ["recipeImportId"])
        .index("by_productId", ["productId"]),

    stepsImports: defineTable({
        recipeImportId: v.id("recipeImports"),
        stepNum: v.number(),
        sourceDescription: v.string(),
        description: v.union(v.string(), v.null()),
    })
        .index("by_recipeImportId", ["recipeImportId"]),

})