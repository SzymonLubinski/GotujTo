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
        // Id konta autora jest zapisywany tylko dla tresci dodanych przez
        // uzytkownikow. Pozwala pokazac profil autora bez ujawniania e-maila.
        authorUserId: v.optional(v.string()),
        description: v.optional(v.string()),
        favorite: v.number(),
        favoriteCount: v.optional(v.number()),
        commentCount: v.optional(v.number()),
        images: v.array(v.id("_storage")),
        videoKey: v.optional(v.string()),
        diets: v.array(v.union(...dietTypes.map((type) => v.literal(type)))),
        types: v.array(v.union(...mealTypes.map((type) => v.literal(type)))),
        occasions: v.array(v.union(...occasions.map((occasion) => v.literal(occasion)))),
        // Uzupełniane przez migrację dla istniejących przepisów.
        feedRank: v.optional(v.number()),
        requiredIngredientGroups: v.optional(v.number()),
    }).index("by_name", ["name"])
        .index("by_feedRank", ["feedRank"])
        .index("by_authorUserId", ["authorUserId"])
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
        // Zdenormalizowana wartość używana do rankingu lodówki i promocji.
        requiredIngredientGroups: v.optional(v.number()),
    }).index('by_productId', ['productId']).index('by_recipeId', ['recipeId']),

    deals: defineTable({
        productId: v.id("products"),
        store: v.union(...stores.map((store) => v.literal(store))),
        dealPrice: v.optional(v.number()),
        lowerBy: v.optional(v.number()),
        regularPrice: v.optional(v.number()),
        promotionDescription: v.optional(v.string()),
        startsAt: v.number(),
        endsAt: v.number(),
    }).index('by_store', ['store'])
        .index('by_store_endsAt', ['store', 'endsAt']),

    contactRateLimits: defineTable({
        // HMAC adresu IP. Nie zapisujemy surowego adresu IP ani e-maila.
        key: v.string(),
        hourStartedAt: v.number(),
        hourlySubmissions: v.number(),
        dayStartedAt: v.number(),
        dailySubmissions: v.number(),
        expiresAt: v.number(),
    }).index("by_key", ["key"]),

    favoriteRecipes: defineTable({
        userId: v.string(),
        recipeId: v.id("recipes"),
        createdAt: v.number(),
    })
        .index("by_user_recipe", ["userId", "recipeId"])
        .index("by_user_createdAt", ["userId", "createdAt"])
        .index("by_recipeId", ["recipeId"]),

    comments: defineTable({
        recipeId: v.id("recipes"),
        authorId: v.string(),
        authorName: v.string(),
        content: v.string(),
        createdAt: v.number(),
    })
        .index("by_recipe_createdAt", ["recipeId", "createdAt"])
        .index("by_authorId", ["authorId"]),

    blogFavorites: defineTable({
        userId: v.string(),
        blogId: v.id("blog"),
        createdAt: v.number(),
    })
        .index("by_user_blog", ["userId", "blogId"])
        .index("by_user_createdAt", ["userId", "createdAt"])
        .index("by_blogId", ["blogId"]),

    blogComments: defineTable({
        blogId: v.id("blog"),
        authorId: v.string(),
        authorName: v.string(),
        content: v.string(),
        createdAt: v.number(),
    })
        .index("by_blog_createdAt", ["blogId", "createdAt"])
        .index("by_authorId", ["authorId"]),

    commentReports: defineTable({
        targetType: v.union(v.literal("recipe"), v.literal("blog")),
        commentId: v.string(),
        reporterId: v.string(),
        createdAt: v.number(),
    })
        .index("by_target_reporter", ["targetType", "commentId", "reporterId"])
        .index("by_target", ["targetType", "commentId"])
        .index("by_reporterId", ["reporterId"])
        .index("by_createdAt", ["createdAt"]),

    // Wspolny limit komentarzy do przepisow i wpisow blogowych. Jeden
    // dokument na konto pozwala ograniczyc spam bez przechowywania IP.
    commentRateLimits: defineTable({
        userId: v.string(),
        windowStartedAt: v.number(),
        commentCount: v.number(),
        updatedAt: v.number(),
    }).index("by_userId", ["userId"]),

    pendingVideoUploads: defineTable({
        videoKey: v.string(),
        ownerId: v.string(),
        createdAt: v.number(),
    })
        .index("by_videoKey", ["videoKey"])
        .index("by_ownerId", ["ownerId"])
        .index("by_createdAt", ["createdAt"]),

    pendingImageUploads: defineTable({
        storageId: v.id("_storage"),
        ownerId: v.string(),
        createdAt: v.number(),
    })
        .index("by_storageId", ["storageId"])
        .index("by_ownerId", ["ownerId"])
        .index("by_createdAt", ["createdAt"]),

    pendingAvatarUploads: defineTable({
        avatarKey: v.string(),
        ownerId: v.string(),
        createdAt: v.number(),
    })
        .index("by_avatarKey", ["avatarKey"])
        .index("by_ownerId", ["ownerId"])
        .index("by_createdAt", ["createdAt"]),

    pendingAdminImageUploads: defineTable({
        storageId: v.id("_storage"),
        createdAt: v.number(),
    })
        .index("by_storageId", ["storageId"])
        .index("by_createdAt", ["createdAt"]),

    pendingAdminVideoUploads: defineTable({
        videoKey: v.string(),
        createdAt: v.number(),
    })
        .index("by_videoKey", ["videoKey"])
        .index("by_createdAt", ["createdAt"]),

    mediaCleanupQueue: defineTable({
        videoKey: v.string(),
        createdAt: v.number(),
        attempts: v.number(),
        lastAttemptAt: v.optional(v.number()),
    })
        .index("by_videoKey", ["videoKey"])
        .index("by_createdAt", ["createdAt"]),

    fridgeProducts: defineTable({
        userId: v.string(),
        productId: v.id("products"),
        createdAt: v.number(),
    })
        .index("by_user_product", ["userId", "productId"])
        .index("by_user_createdAt", ["userId", "createdAt"]),

    accountDeletionRequests: defineTable({
        userId: v.string(),
        deleteApprovedRecipes: v.boolean(),
        expiresAt: v.number(),
    }).index("by_userId", ["userId"]),

    // Celowo nie korzystamy tu bezposrednio z tabel Better Auth. Publicznie
    // dostepne sa wylacznie nazwa i avatar, a nie np. adres e-mail uzytkownika.
    publicProfiles: defineTable({
        userId: v.string(),
        name: v.string(),
        image: v.optional(v.string()),
        updatedAt: v.number(),
    }).index("by_userId", ["userId"]),

    recipeSubmissions: defineTable({
        authorId: v.string(),
        authorName: v.optional(v.string()),
        name: v.string(),
        description: v.string(),
        cookingMinutes: v.number(),
        servings: v.number(),
        ingredients: v.array(v.string()),
        steps: v.array(v.string()),
        // Pelne dane nowych zgloszen. Pola powyzej zostaja dla zgodnosci
        // z wczesniejszymi, tekstowymi zgloszeniami.
        recipeData: v.optional(v.object({
            name: v.string(),
            description: v.string(),
            cookingMinutes: v.number(),
            servings: v.number(),
            images: v.array(v.id("_storage")),
            videoKey: v.optional(v.string()),
            diets: v.array(v.union(...dietTypes.map((type) => v.literal(type)))),
            types: v.array(v.union(...mealTypes.map((type) => v.literal(type)))),
            occasions: v.array(v.union(...occasions.map((occasion) => v.literal(occasion)))),
            ingredientGroups: v.array(v.object({
                main: v.object({
                    productId: v.id("products"),
                    metricUnit: v.union(...metricUnits.map((unit) => v.literal(unit))),
                    customaryUnit: v.union(...customaryUnits.map((unit) => v.literal(unit))),
                    metricQuantity: v.number(),
                    customaryQuantity: v.number(),
                    optional: v.boolean(),
                }),
                substitutes: v.array(v.object({
                    productId: v.id("products"),
                    metricUnit: v.union(...metricUnits.map((unit) => v.literal(unit))),
                    customaryUnit: v.union(...customaryUnits.map((unit) => v.literal(unit))),
                    metricQuantity: v.number(),
                    customaryQuantity: v.number(),
                    optional: v.boolean(),
                })),
            })),
            recipeSteps: v.array(v.object({
                description: v.string(),
            })),
        })),
        status: v.union(
            v.literal("pending"),
            v.literal("approved"),
            v.literal("rejected"),
        ),
        adminNote: v.optional(v.string()),
        reviewedRecipeId: v.optional(v.id("recipes")),
        reviewedAt: v.optional(v.number()),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_author_createdAt", ["authorId", "createdAt"])
        .index("by_status_createdAt", ["status", "createdAt"]),

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
        authorName: v.optional(v.string()),
        authorUserId: v.optional(v.string()),
        type: v.union(v.literal("tip"), v.literal("article"), v.literal("joke"),),
        images: v.array(v.id("_storage")),
        videoKey: v.optional(v.string()),
        active: v.boolean(),
        publishedAt: v.number(),
        favoriteCount: v.optional(v.number()),
        commentCount: v.optional(v.number()),
        // Uzupelniane dla nowych wpisow; starsze obsluguje wariant zgodnosci.
        feedRank: v.optional(v.number()),
    })
        .index("by_active_publishedAt", ["active", "publishedAt"])
        .index("by_active_feedRank", ["active", "feedRank"])
        .index("by_authorUserId_active_publishedAt", ["authorUserId", "active", "publishedAt"]),

    blogSubmissions: defineTable({
        authorId: v.string(),
        authorName: v.optional(v.string()),
        title: v.string(),
        description: v.string(),
        type: v.union(v.literal("tip"), v.literal("article"), v.literal("joke")),
        images: v.array(v.id("_storage")),
        videoKey: v.optional(v.string()),
        status: v.union(
            v.literal("pending"),
            v.literal("approved"),
            v.literal("rejected"),
        ),
        adminNote: v.optional(v.string()),
        reviewedBlogId: v.optional(v.id("blog")),
        reviewedAt: v.optional(v.number()),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_author_createdAt", ["authorId", "createdAt"])
        .index("by_status_createdAt", ["status", "createdAt"]),

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
