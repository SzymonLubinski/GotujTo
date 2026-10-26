import {ConvexError, v} from "convex/values";
import {type MutationCtx, internalMutation, query, mutation, type QueryCtx} from "./_generated/server";
import {type Doc, type Id} from "./_generated/dataModel";
import {authComponent, createAuth} from "./auth";
import {customaryUnits, dietTypes, mealTypes, metricUnits, occasions} from "../shared/data/stableData";
import {requireAdmin} from "./lib/requireAdmin";
import {internal} from "./_generated/api";


type AuthenticatedCtx = QueryCtx | MutationCtx;

async function requireUser(ctx: AuthenticatedCtx) {
    const user = await authComponent.getAuthUser(ctx);

    if (!user) {
        throw new ConvexError({
            code: "UNAUTHENTICATED",
            message: "Zaloguj sie, aby wykonac te operacje.",
        });
    }

    return user;
}

function requireText(value: string, field: string, maxLength: number) {
    const normalizedValue = value.trim();

    if (!normalizedValue) {
        throw new ConvexError({
            code: "INVALID_INPUT",
            message: `Pole ${field} jest wymagane.`,
        });
    }

    if (normalizedValue.length > maxLength) {
        throw new ConvexError({
            code: "INVALID_INPUT",
            message: `Pole ${field} jest za dlugie.`,
        });
    }

    return normalizedValue;
}

const MAX_SUBMISSION_IMAGE_SIZE = 10 * 1024 * 1024;
const allowedSubmissionImageTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
]);

const ACCOUNT_DELETION_REQUEST_TTL_MS = 15 * 60 * 1000;
const MAX_COMMENT_LENGTH = 1_000;
const COMMENT_RATE_LIMIT = 10;
const COMMENT_RATE_LIMIT_WINDOW_MS = 30 * 60 * 1000;
const MAX_PENDING_RECIPE_SUBMISSIONS = 10;
type CommentTargetType = "recipe" | "blog";

// Lista obejmuje jednoznaczne polskie i angielskie wulgaryzmy. Sprawdzenie
// pozostaje po stronie serwera, aby nie mozna bylo go ominac przez klienta.
const blockedCommentWords = new Set([
    "asshole",
    "bitch",
    "chuj",
    "chuja",
    "chujem",
    "chujnia",
    "chujowy",
    "chujowa",
    "chujowe",
    "cipa",
    "cipka",
    "cipy",
    "cunt",
    "cwel",
    "cwela",
    "cwele",
    "cwelu",
    "dick",
    "dupa",
    "dupek",
    "fuck",
    "fucker",
    "fucking",
    "gowno",
    "gowniany",
    "jebac",
    "jebal",
    "jebala",
    "jebane",
    "jebany",
    "jebana",
    "jebie",
    "jebiesz",
    "kurwa",
    "kurwie",
    "kurwo",
    "kurwy",
    "kurew",
    "kurestwo",
    "motherfucker",
    "pierdolic",
    "pierdol",
    "pierdole",
    "pierdolisz",
    "pierdolony",
    "pierdolona",
    "pierdolone",
    "pizda",
    "pizdy",
    "pizdo",
    "pizde",
    "pizdzie",
    "pizdka",
    "pussy",
    "shit",
    "skurwiel",
    "skurwysyn",
    "skurwysyna",
    "skurwysynem",
    "spierdalaj",
    "spierdalac",
    "suka",
    "suki",
    "suko",
    "wypierdalaj",
    "wypierdalac",
]);

const blockedCommentPrefixes = [
    "chuj",
    "jeb",
    "kurw",
    "pierd",
    "pizd",
    "skurw",
    "spierdal",
    "wypierdal",
    "fuck",
];

function getCommentModerationTokens(content: string) {
    const normalized = content
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[@4]/g, "a")
        .replace(/[\u20ac3]/g, "e")
        .replace(/[!1]/g, "i")
        .replace(/[0]/g, "o")
        .replace(/[$5]/g, "s")
        .replace(/[7]/g, "t")
        .replace(/(.)\1{1,}/g, "$1")
        .replace(/[^a-z]+/g, " ");

    const tokens = normalized.trim().split(/\s+/).filter(Boolean);
    const separatedLetters = new Set<string>();
    let currentSequence = "";

    for (const token of tokens) {
        if (token.length === 1) {
            currentSequence += token;
            continue;
        }

        if (currentSequence.length >= 4) {
            separatedLetters.add(currentSequence);
        }

        currentSequence = "";
    }

    if (currentSequence.length >= 4) {
        separatedLetters.add(currentSequence);
    }

    return [...tokens, ...separatedLetters];
}

function assertCommentIsAcceptable(content: string) {
    const tokens = getCommentModerationTokens(content);

    if (tokens.some(token =>
        blockedCommentWords.has(token)
        || blockedCommentPrefixes.some(prefix => token.startsWith(prefix)),
    )) {
        throw new ConvexError({
            code: "INAPPROPRIATE_COMMENT",
            message: "Komentarz zawiera niedozwolone wulgaryzmy.",
        });
    }
}

async function consumeCommentRateLimit(ctx: MutationCtx, userId: string) {
    const now = Date.now();
    const limit = await ctx.db
        .query("commentRateLimits")
        .withIndex("by_userId", index => index.eq("userId", userId))
        .unique();

    if (!limit) {
        await ctx.db.insert("commentRateLimits", {
            userId,
            windowStartedAt: now,
            commentCount: 1,
            updatedAt: now,
        });
        return;
    }

    const windowEndsAt = limit.windowStartedAt + COMMENT_RATE_LIMIT_WINDOW_MS;

    if (now >= windowEndsAt) {
        await ctx.db.patch(limit._id, {
            windowStartedAt: now,
            commentCount: 1,
            updatedAt: now,
        });
        return;
    }

    if (limit.commentCount >= COMMENT_RATE_LIMIT) {
        const minutesRemaining = Math.max(1, Math.ceil((windowEndsAt - now) / 60_000));

        throw new ConvexError({
            code: "COMMENT_RATE_LIMIT",
            message: `Mozesz dodac maksymalnie ${COMMENT_RATE_LIMIT} komentarzy w ciagu 30 minut. Sprobuj ponownie za okolo ${minutesRemaining} min.`,
        });
    }

    await ctx.db.patch(limit._id, {
        commentCount: limit.commentCount + 1,
        updatedAt: now,
    });
}

function isManagedMediaKey(mediaKey: string) {
    return mediaKey.startsWith("avatars/")
        || mediaKey.startsWith("recipes/")
        || mediaKey.startsWith("recipe-submissions/")
        || mediaKey.startsWith("blog-submissions/");
}

async function enqueueVideoCleanup(ctx: MutationCtx, videoKey: string | undefined) {
    if (!videoKey || !isManagedMediaKey(videoKey)) {
        return;
    }

    const existingEntry = await ctx.db
        .query("mediaCleanupQueue")
        .withIndex("by_videoKey", index => index.eq("videoKey", videoKey))
        .unique();

    if (!existingEntry) {
        await ctx.db.insert("mediaCleanupQueue", {
            videoKey,
            createdAt: Date.now(),
            attempts: 0,
        });
    }
}

function isSubmissionVideoKey(videoKey: string, purpose: "recipe" | "blog") {
    return purpose === "recipe"
        ? videoKey.startsWith("recipe-submissions/")
        : videoKey.startsWith("blog-submissions/");
}

async function consumePendingSubmissionImages(
    ctx: MutationCtx,
    ownerId: string,
    imageIds: Id<"_storage">[],
) {
    await Promise.all([...new Set(imageIds)].map(async storageId => {
        const pendingUpload = await ctx.db
            .query("pendingImageUploads")
            .withIndex("by_storageId", index => index.eq("storageId", storageId))
            .unique();

        if (!pendingUpload) {
            return;
        }

        if (pendingUpload.ownerId !== ownerId) {
            throw new ConvexError({
                code: "INVALID_IMAGE",
                message: "Zdjecie nie nalezy do tego konta.",
            });
        }

        await ctx.db.delete(pendingUpload._id);
    }));
}

async function consumePendingSubmissionVideo(
    ctx: MutationCtx,
    ownerId: string,
    videoKey: string | undefined,
) {
    if (!videoKey) {
        return;
    }

    const pendingUpload = await ctx.db
        .query("pendingVideoUploads")
        .withIndex("by_videoKey", index => index.eq("videoKey", videoKey))
        .unique();

    if (!pendingUpload) {
        return;
    }

    if (pendingUpload.ownerId !== ownerId) {
        throw new ConvexError({
            code: "INVALID_VIDEO",
            message: "Film nie nalezy do tego konta.",
        });
    }

    await ctx.db.delete(pendingUpload._id);
}

function getAvatarKeyFromUrl(image: string | null | undefined) {
    if (!image) {
        return undefined;
    }

    const marker = "/avatars/";
    const markerIndex = image.indexOf(marker);

    return markerIndex >= 0
        ? image.slice(markerIndex + 1)
        : undefined;
}

type PublicProfileUser = {
    _id: string;
    name?: string | null;
    image?: string | null;
};

function getPublicProfileData(user: PublicProfileUser) {
    return {
        name: typeof user.name === "string" && user.name.trim()
            ? user.name.trim().slice(0, 120)
            : "Uzytkownik GotujTo",
        image: typeof user.image === "string" && user.image.trim()
            ? user.image.trim().slice(0, 2_000)
            : undefined,
    };
}

async function upsertPublicProfile(ctx: MutationCtx, user: PublicProfileUser) {
    const profile = await ctx.db
        .query("publicProfiles")
        .withIndex("by_userId", index => index.eq("userId", user._id))
        .unique();
    const data = getPublicProfileData(user);
    const currentAvatarKey = getAvatarKeyFromUrl(data.image);

    if (currentAvatarKey) {
        const pendingAvatar = await ctx.db
            .query("pendingAvatarUploads")
            .withIndex("by_avatarKey", index => index.eq("avatarKey", currentAvatarKey))
            .unique();

        if (pendingAvatar?.ownerId === user._id) {
            await ctx.db.delete(pendingAvatar._id);
        }
    }

    if (!profile) {
        await ctx.db.insert("publicProfiles", {
            userId: user._id,
            ...data,
            updatedAt: Date.now(),
        });
        return;
    }

    if (profile.name !== data.name || profile.image !== data.image) {
        const previousAvatarKey = getAvatarKeyFromUrl(profile.image);

        if (previousAvatarKey && previousAvatarKey !== currentAvatarKey) {
            await enqueueVideoCleanup(ctx, previousAvatarKey);
        }

        await ctx.db.patch(profile._id, {
            ...data,
            updatedAt: Date.now(),
        });
    }
}

type CommentWithAuthor = {
    authorId: string;
    authorName: string;
};

async function withCurrentCommentAuthors<T extends CommentWithAuthor>(
    ctx: QueryCtx,
    comments: T[],
) {
    let currentUserId: string | null = null;

    try {
        currentUserId = (await authComponent.getAuthUser(ctx))?._id ?? null;
    } catch {
        // During sign-out a stale token can briefly reach this public query.
    }

    const authorIds = [...new Set(comments.map(comment => comment.authorId))];
    const profiles = await Promise.all(
        authorIds.map(async authorId => [
            authorId,
            await ctx.db
                .query("publicProfiles")
                .withIndex("by_userId", index => index.eq("userId", authorId))
                .unique(),
        ] as const),
    );
    const profilesByAuthorId = new Map(profiles);

    return comments.map(comment => {
        const profile = profilesByAuthorId.get(comment.authorId);

        return {
            ...comment,
            ...(profile ? {authorName: profile.name} : {}),
            authorAvatarUrl: profile?.image ?? null,
            isOwn: comment.authorId === currentUserId,
        };
    });
}

async function linkApprovedContentToPublicProfile(ctx: MutationCtx, userId: string) {
    const [recipeSubmissions, blogSubmissions] = await Promise.all([
        ctx.db
            .query("recipeSubmissions")
            .withIndex("by_author_createdAt", index => index.eq("authorId", userId))
            .collect(),
        ctx.db
            .query("blogSubmissions")
            .withIndex("by_author_createdAt", index => index.eq("authorId", userId))
            .collect(),
    ]);

    await Promise.all([
        ...recipeSubmissions.flatMap(submission =>
            submission.status === "approved" && submission.reviewedRecipeId
                ? [submission.reviewedRecipeId]
                : [],
        ).map(async recipeId => {
            const recipe = await ctx.db.get(recipeId);

            if (recipe && !recipe.authorUserId) {
                await ctx.db.patch(recipeId, {authorUserId: userId});
            }
        }),
        ...blogSubmissions.flatMap(submission =>
            submission.status === "approved" && submission.reviewedBlogId
                ? [submission.reviewedBlogId]
                : [],
        ).map(async blogId => {
            const blog = await ctx.db.get(blogId);

            if (blog && !blog.authorUserId) {
                await ctx.db.patch(blogId, {authorUserId: userId});
            }
        }),
    ]);
}

async function deletePublicRecipe(ctx: MutationCtx, recipeId: Id<"recipes">) {
    const recipe = await ctx.db.get(recipeId);

    if (!recipe) {
        return;
    }

    const [ingredients, steps, favorites, comments] = await Promise.all([
        ctx.db.query("ingredients").withIndex("by_recipeId", index => index.eq("recipeId", recipeId)).collect(),
        ctx.db.query("steps").withIndex("by_recipeId", index => index.eq("recipeId", recipeId)).collect(),
        ctx.db.query("favoriteRecipes").withIndex("by_recipeId", index => index.eq("recipeId", recipeId)).collect(),
        ctx.db.query("comments").withIndex("by_recipe_createdAt", index => index.eq("recipeId", recipeId)).collect(),
    ]);

    const commentReports = await Promise.all(
        comments.map(comment => ctx.db
            .query("commentReports")
            .withIndex("by_target", index =>
                index.eq("targetType", "recipe").eq("commentId", comment._id),
            )
            .collect()),
    );

    await Promise.all([
        ...ingredients.map(ingredient => ctx.db.delete(ingredient._id)),
        ...steps.map(step => ctx.db.delete(step._id)),
        ...favorites.map(favorite => ctx.db.delete(favorite._id)),
        ...comments.map(comment => ctx.db.delete(comment._id)),
        ...commentReports.flat().map(report => ctx.db.delete(report._id)),
        ...recipe.images.map(imageId => ctx.storage.delete(imageId)),
    ]);

    await enqueueVideoCleanup(ctx, recipe.videoKey);
    await ctx.db.delete(recipe._id);

    await ctx.scheduler.runAfter(
        0,
        internal.indexNow.submitUrls,
        {
            urls: [`https://gotujto.com/recipe/${recipeId}`],
        },
    );
}

const submissionIngredientV = v.object({
    productId: v.id("products"),
    metricUnit: v.union(...metricUnits.map(unit => v.literal(unit))),
    customaryUnit: v.union(...customaryUnits.map(unit => v.literal(unit))),
    metricQuantity: v.number(),
    customaryQuantity: v.number(),
    optional: v.boolean(),
});

const submissionRecipeDataV = v.object({
    name: v.string(),
    description: v.string(),
    cookingMinutes: v.number(),
    servings: v.number(),
    images: v.array(v.id("_storage")),
    videoKey: v.optional(v.string()),
    diets: v.array(v.union(...dietTypes.map(type => v.literal(type)))),
    types: v.array(v.union(...mealTypes.map(type => v.literal(type)))),
    occasions: v.array(v.union(...occasions.map(occasion => v.literal(occasion)))),
    ingredientGroups: v.array(v.object({
        main: submissionIngredientV,
        substitutes: v.array(submissionIngredientV),
    })),
    recipeSteps: v.array(v.object({
        description: v.string(),
    })),
});

async function validateSubmissionImages(
    ctx: MutationCtx,
    imageIds: Id<"_storage">[],
) {
    if (imageIds.length < 1 || imageIds.length > 8) {
        throw new ConvexError({
            code: "INVALID_INPUT",
            message: "Dodaj od 1 do 8 zdjec przepisu.",
        });
    }

    for (const storageId of imageIds) {
        const metadata = await ctx.db.system.get("_storage", storageId);

        if (!metadata) {
            throw new ConvexError({
                code: "INVALID_IMAGE",
                message: "Nie znaleziono przeslanego zdjecia.",
            });
        }

        if (metadata.size > MAX_SUBMISSION_IMAGE_SIZE) {
            throw new ConvexError({
                code: "INVALID_IMAGE",
                message: "Zdjecie moze miec maksymalnie 10 MB.",
            });
        }

        if (!metadata.contentType || !allowedSubmissionImageTypes.has(metadata.contentType)) {
            throw new ConvexError({
                code: "INVALID_IMAGE",
                message: "Dozwolone formaty zdjec: JPG, PNG i WebP.",
            });
        }
    }
}

async function validateOptionalSubmissionImages(
    ctx: MutationCtx,
    imageIds: Id<"_storage">[],
    maxImages = 8,
) {
    if (imageIds.length > maxImages) {
        throw new ConvexError({
            code: "INVALID_INPUT",
            message: `Mozesz dodac maksymalnie ${maxImages} zdjec.`,
        });
    }

    if (imageIds.length > 0) {
        await validateSubmissionImages(ctx, imageIds);
    }
}

function validateBlogSubmissionVideoKey(videoKey: string | undefined) {
    if (!videoKey) {
        return;
    }

    if (
        !videoKey.startsWith("blog-submissions/")
        || videoKey.length > 300
    ) {
        throw new ConvexError({
            code: "INVALID_VIDEO",
            message: "Nieprawidlowy film wpisu.",
        });
    }
}

function validateRecipeSubmissionVideoKey(videoKey: string | undefined) {
    if (!videoKey) {
        return;
    }

    if (
        !videoKey.startsWith("recipe-submissions/")
        || videoKey.length > 300
    ) {
        throw new ConvexError({
            code: "INVALID_VIDEO",
            message: "Nieprawidlowy film przepisu.",
        });
    }
}

function getPublicVideoUrl(videoKey: string | undefined) {
    const publicUrl = process.env.R2_PUBLIC_URL;

    return videoKey && publicUrl
        ? `${publicUrl}/${videoKey}`
        : undefined;
}

function getSubmissionFeedRank(recipeId: string) {
    const input = `feed-rank:${recipeId}`;
    let hash = 2166136261;

    for (let index = 0; index < input.length; index++) {
        hash ^= input.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }

    return hash >>> 0;
}

export const getFavoriteRecipes = query({
    args: {},
    handler: async (ctx) => {
        const user = await authComponent.getAuthUser(ctx);

        if (!user) {
            return [];
        }

        const favorites = await ctx.db
            .query("favoriteRecipes")
            .withIndex("by_user_createdAt", index => index.eq("userId", user._id))
            .order("desc")
            .take(100);

        const recipes = await Promise.all(
            favorites.map(async favorite => await ctx.db.get(favorite.recipeId)),
        );

        return recipes.filter(recipe => recipe !== null);
    },
});

export const syncPublicProfile = mutation({
    args: {},
    handler: async ctx => {
        const user = await requireUser(ctx);
        await upsertPublicProfile(ctx, user);
        await linkApprovedContentToPublicProfile(ctx, user._id);
    },
});

export const getPublicProfile = query({
    args: {
        userId: v.string(),
    },
    handler: async (ctx, args) => {
        const profile = await ctx.db
            .query("publicProfiles")
            .withIndex("by_userId", index => index.eq("userId", args.userId))
            .unique();

        if (!profile) {
            return null;
        }

        const [recipes, blogPosts] = await Promise.all([
            ctx.db
                .query("recipes")
                .withIndex("by_authorUserId", index => index.eq("authorUserId", args.userId))
                .order("desc")
                .take(100),
            ctx.db
                .query("blog")
                .withIndex("by_authorUserId_active_publishedAt", index =>
                    index.eq("authorUserId", args.userId).eq("active", true),
                )
                .order("desc")
                .take(100),
        ]);

        return {
            profile: {
                userId: profile.userId,
                name: profile.name,
                image: profile.image,
            },
            recipes: await Promise.all(recipes.map(async recipe => ({
                _id: recipe._id,
                name: recipe.name,
                description: recipe.description ?? "",
                cookingMinutes: recipe.cookingMinutes,
                servings: recipe.servings,
                images: (await Promise.all(
                    recipe.images.map(imageId => ctx.storage.getUrl(imageId)),
                )).filter((url): url is string => url !== null),
                videoUrl: getPublicVideoUrl(recipe.videoKey),
                favoriteCount: recipe.favoriteCount ?? 0,
                commentCount: recipe.commentCount ?? 0,
            }))),
            blogPosts: await Promise.all(blogPosts.map(async blog => ({
                _id: blog._id,
                title: blog.title,
                description: blog.description,
                type: blog.type,
                publishedAt: blog.publishedAt,
                images: (await Promise.all(
                    blog.images.map(imageId => ctx.storage.getUrl(imageId)),
                )).filter((url): url is string => url !== null),
                videoUrl: getPublicVideoUrl(blog.videoKey),
                favoriteCount: blog.favoriteCount ?? 0,
                commentCount: blog.commentCount ?? 0,
            }))),
        };
    },
});

export const getFavoriteState = query({
    args: {
        recipeId: v.id("recipes"),
    },
    handler: async (ctx, args) => {
        let user;

        try {
            user = await authComponent.getAuthUser(ctx);
        } catch {
            // Po wylogowaniu klient Convex moze przez moment wyslac zapytanie
            // ze starym tokenem. Dla publicznego stanu ulubionego bezpiecznie
            // traktujemy go tak samo jak niezalogowanego uzytkownika.
            return false;
        }

        if (!user) {
            return false;
        }

        const favorite = await ctx.db
            .query("favoriteRecipes")
            .withIndex("by_user_recipe", index =>
                index.eq("userId", user._id).eq("recipeId", args.recipeId),
            )
            .first();

        return favorite !== null;
    },
});

export const toggleFavoriteRecipe = mutation({
    args: {
        recipeId: v.id("recipes"),
    },
    handler: async (ctx, args) => {
        const user = await requireUser(ctx);
        const recipe = await ctx.db.get(args.recipeId);

        if (!recipe) {
            throw new ConvexError({
                code: "RECIPE_NOT_FOUND",
                message: "Nie znaleziono przepisu.",
            });
        }

        const existingFavorite = await ctx.db
            .query("favoriteRecipes")
            .withIndex("by_user_recipe", index =>
                index.eq("userId", user._id).eq("recipeId", args.recipeId),
            )
            .first();
        const existingFavoriteCount = recipe.favoriteCount ?? 0;

        if (existingFavorite) {
            await ctx.db.delete(existingFavorite._id);
            await ctx.db.patch(recipe._id, {
                favoriteCount: Math.max(existingFavoriteCount - 1, 0),
            });
            return false;
        }

        await ctx.db.insert("favoriteRecipes", {
            userId: user._id,
            recipeId: args.recipeId,
            createdAt: Date.now(),
        });
        await ctx.db.patch(recipe._id, {
            favoriteCount: existingFavoriteCount + 1,
        });

        return true;
    },
});

export const getRecipeComments = query({
    args: {
        recipeId: v.id("recipes"),
    },
    handler: async (ctx, args) => {
        const comments = await ctx.db
            .query("comments")
            .withIndex("by_recipe_createdAt", index => index.eq("recipeId", args.recipeId))
            .order("desc")
            .take(100);

        return await withCurrentCommentAuthors(ctx, comments);
    },
});

export const addRecipeComment = mutation({
    args: {
        recipeId: v.id("recipes"),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await requireUser(ctx);
        const recipe = await ctx.db.get(args.recipeId);

        if (!recipe) {
            throw new ConvexError({
                code: "RECIPE_NOT_FOUND",
                message: "Nie znaleziono przepisu.",
            });
        }

        const content = requireText(args.content, "komentarz", MAX_COMMENT_LENGTH);
        assertCommentIsAcceptable(content);
        await consumeCommentRateLimit(ctx, user._id);
        await upsertPublicProfile(ctx, user);
        const authorName = typeof user.name === "string" && user.name.trim()
            ? user.name.trim().slice(0, 120)
            : "Uzytkownik GotujTo";

        const existingCommentCount = recipe.commentCount ?? 0;
        const commentId = await ctx.db.insert("comments", {
            recipeId: args.recipeId,
            authorId: user._id,
            authorName,
            content,
            createdAt: Date.now(),
        });

        await ctx.db.patch(recipe._id, {
            commentCount: existingCommentCount + 1,
        });

        return commentId;
    },
});

export const reportRecipeComment = mutation({
    args: {
        commentId: v.id("comments"),
    },
    handler: async (ctx, args) => {
        const user = await requireUser(ctx);
        const comment = await ctx.db.get(args.commentId);

        if (!comment) {
            throw new ConvexError({
                code: "COMMENT_NOT_FOUND",
                message: "Nie znaleziono komentarza.",
            });
        }

        if (comment.authorId === user._id) {
            throw new ConvexError({
                code: "CANNOT_REPORT_OWN_COMMENT",
                message: "Nie mozesz zglosic wlasnego komentarza.",
            });
        }

        const existingReport = await ctx.db
            .query("commentReports")
            .withIndex("by_target_reporter", index =>
                index
                    .eq("targetType", "recipe")
                    .eq("commentId", args.commentId)
                    .eq("reporterId", user._id),
            )
            .unique();

        if (existingReport) {
            return false;
        }

        await ctx.db.insert("commentReports", {
            targetType: "recipe",
            commentId: args.commentId,
            reporterId: user._id,
            createdAt: Date.now(),
        });

        return true;
    },
});

export const deleteOwnRecipeComment = mutation({
    args: {
        commentId: v.id("comments"),
    },
    handler: async (ctx, args) => {
        const user = await requireUser(ctx);
        const comment = await ctx.db.get(args.commentId);

        if (!comment) {
            throw new ConvexError({code: "COMMENT_NOT_FOUND", message: "Nie znaleziono komentarza."});
        }

        if (comment.authorId !== user._id) {
            throw new ConvexError({code: "COMMENT_FORBIDDEN", message: "Nie możesz usunąć tego komentarza."});
        }

        const [recipe, reports] = await Promise.all([
            ctx.db.get(comment.recipeId),
            ctx.db
                .query("commentReports")
                .withIndex("by_target", index => index.eq("targetType", "recipe").eq("commentId", args.commentId))
                .collect(),
        ]);

        await Promise.all([
            ctx.db.delete(comment._id),
            ...reports.map(report => ctx.db.delete(report._id)),
            ...(recipe ? [ctx.db.patch(recipe._id, {
                commentCount: Math.max((recipe.commentCount ?? 0) - 1, 0),
            })] : []),
        ]);
    },
});

export const getBlogFavoriteState = query({
    args: {
        blogId: v.id("blog"),
    },
    handler: async (ctx, args) => {
        let user;

        try {
            user = await authComponent.getAuthUser(ctx);
        } catch {
            return false;
        }

        if (!user) {
            return false;
        }

        const favorite = await ctx.db
            .query("blogFavorites")
            .withIndex("by_user_blog", index =>
                index.eq("userId", user._id).eq("blogId", args.blogId),
            )
            .first();

        return favorite !== null;
    },
});

export const toggleFavoriteBlog = mutation({
    args: {
        blogId: v.id("blog"),
    },
    handler: async (ctx, args) => {
        const user = await requireUser(ctx);
        const blog = await ctx.db.get(args.blogId);

        if (!blog || !blog.active) {
            throw new ConvexError({
                code: "BLOG_NOT_FOUND",
                message: "Nie znaleziono wpisu blogowego.",
            });
        }

        const existingFavorite = await ctx.db
            .query("blogFavorites")
            .withIndex("by_user_blog", index =>
                index.eq("userId", user._id).eq("blogId", args.blogId),
            )
            .first();
        const existingFavoriteCount = blog.favoriteCount ?? 0;

        if (existingFavorite) {
            await ctx.db.delete(existingFavorite._id);
            await ctx.db.patch(blog._id, {
                favoriteCount: Math.max(existingFavoriteCount - 1, 0),
            });
            return false;
        }

        await ctx.db.insert("blogFavorites", {
            userId: user._id,
            blogId: args.blogId,
            createdAt: Date.now(),
        });
        await ctx.db.patch(blog._id, {
            favoriteCount: existingFavoriteCount + 1,
        });

        return true;
    },
});

export const getBlogComments = query({
    args: {
        blogId: v.id("blog"),
    },
    handler: async (ctx, args) => {
        const comments = await ctx.db
            .query("blogComments")
            .withIndex("by_blog_createdAt", index => index.eq("blogId", args.blogId))
            .order("desc")
            .take(100);

        return await withCurrentCommentAuthors(ctx, comments);
    },
});

export const addBlogComment = mutation({
    args: {
        blogId: v.id("blog"),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await requireUser(ctx);
        const blog = await ctx.db.get(args.blogId);

        if (!blog || !blog.active) {
            throw new ConvexError({
                code: "BLOG_NOT_FOUND",
                message: "Nie znaleziono wpisu blogowego.",
            });
        }

        const content = requireText(args.content, "komentarz", MAX_COMMENT_LENGTH);
        assertCommentIsAcceptable(content);
        await consumeCommentRateLimit(ctx, user._id);
        await upsertPublicProfile(ctx, user);
        const authorName = typeof user.name === "string" && user.name.trim()
            ? user.name.trim().slice(0, 120)
            : "Uzytkownik GotujTo";
        const existingCommentCount = blog.commentCount ?? 0;
        const commentId = await ctx.db.insert("blogComments", {
            blogId: args.blogId,
            authorId: user._id,
            authorName,
            content,
            createdAt: Date.now(),
        });

        await ctx.db.patch(blog._id, {
            commentCount: existingCommentCount + 1,
        });

        return commentId;
    },
});

export const reportBlogComment = mutation({
    args: {
        commentId: v.id("blogComments"),
    },
    handler: async (ctx, args) => {
        const user = await requireUser(ctx);
        const comment = await ctx.db.get(args.commentId);

        if (!comment) {
            throw new ConvexError({
                code: "COMMENT_NOT_FOUND",
                message: "Nie znaleziono komentarza.",
            });
        }

        if (comment.authorId === user._id) {
            throw new ConvexError({
                code: "CANNOT_REPORT_OWN_COMMENT",
                message: "Nie mozesz zglosic wlasnego komentarza.",
            });
        }

        const existingReport = await ctx.db
            .query("commentReports")
            .withIndex("by_target_reporter", index =>
                index
                    .eq("targetType", "blog")
                    .eq("commentId", args.commentId)
                    .eq("reporterId", user._id),
            )
            .unique();

        if (existingReport) {
            return false;
        }

        await ctx.db.insert("commentReports", {
            targetType: "blog",
            commentId: args.commentId,
            reporterId: user._id,
            createdAt: Date.now(),
        });

        return true;
    },
});

export const deleteOwnBlogComment = mutation({
    args: {
        commentId: v.id("blogComments"),
    },
    handler: async (ctx, args) => {
        const user = await requireUser(ctx);
        const comment = await ctx.db.get(args.commentId);

        if (!comment) {
            throw new ConvexError({code: "COMMENT_NOT_FOUND", message: "Nie znaleziono komentarza."});
        }

        if (comment.authorId !== user._id) {
            throw new ConvexError({code: "COMMENT_FORBIDDEN", message: "Nie możesz usunąć tego komentarza."});
        }

        const [blog, reports] = await Promise.all([
            ctx.db.get(comment.blogId),
            ctx.db
                .query("commentReports")
                .withIndex("by_target", index => index.eq("targetType", "blog").eq("commentId", args.commentId))
                .collect(),
        ]);

        await Promise.all([
            ctx.db.delete(comment._id),
            ...reports.map(report => ctx.db.delete(report._id)),
            ...(blog ? [ctx.db.patch(blog._id, {
                commentCount: Math.max((blog.commentCount ?? 0) - 1, 0),
            })] : []),
        ]);
    },
});

export const getFridgeProducts = query({
    args: {},
    handler: async (ctx) => {
        const user = await authComponent.getAuthUser(ctx);

        if (!user) {
            return [];
        }

        const fridgeProducts = await ctx.db
            .query("fridgeProducts")
            .withIndex("by_user_createdAt", index => index.eq("userId", user._id))
            .order("desc")
            .take(100);

        const products = await Promise.all(
            fridgeProducts.map(async entry => await ctx.db.get(entry.productId)),
        );

        return products.filter(product => product !== null);
    },
});

export const addFridgeProduct = mutation({
    args: {
        productId: v.id("products"),
    },
    handler: async (ctx, args) => {
        const user = await requireUser(ctx);
        const product = await ctx.db.get(args.productId);

        if (!product) {
            throw new ConvexError({
                code: "PRODUCT_NOT_FOUND",
                message: "Nie znaleziono produktu.",
            });
        }

        const existingEntry = await ctx.db
            .query("fridgeProducts")
            .withIndex("by_user_product", index =>
                index.eq("userId", user._id).eq("productId", args.productId),
            )
            .first();

        if (existingEntry) {
            return existingEntry._id;
        }

        return await ctx.db.insert("fridgeProducts", {
            userId: user._id,
            productId: args.productId,
            createdAt: Date.now(),
        });
    },
});

export const removeFridgeProduct = mutation({
    args: {
        productId: v.id("products"),
    },
    handler: async (ctx, args) => {
        const user = await requireUser(ctx);
        const entry = await ctx.db
            .query("fridgeProducts")
            .withIndex("by_user_product", index =>
                index.eq("userId", user._id).eq("productId", args.productId),
            )
            .first();

        if (entry) {
            await ctx.db.delete(entry._id);
        }
    },
});

export const clearFridgeProducts = mutation({
    args: {},
    handler: async (ctx) => {
        const user = await requireUser(ctx);
        const entries = await ctx.db
            .query("fridgeProducts")
            .withIndex("by_user_createdAt", index => index.eq("userId", user._id))
            .take(100);

        await Promise.all(entries.map(entry => ctx.db.delete(entry._id)));
    },
});

export const prepareAccountDeletion = mutation({
    args: {
        deleteApprovedRecipes: v.boolean(),
    },
    handler: async (ctx, args) => {
        const user = await requireUser(ctx);
        const existingRequest = await ctx.db
            .query("accountDeletionRequests")
            .withIndex("by_userId", index => index.eq("userId", user._id))
            .first();
        const expiresAt = Date.now() + ACCOUNT_DELETION_REQUEST_TTL_MS;

        if (existingRequest) {
            await ctx.db.patch(existingRequest._id, {
                deleteApprovedRecipes: args.deleteApprovedRecipes,
                expiresAt,
            });
            return;
        }

        await ctx.db.insert("accountDeletionRequests", {
            userId: user._id,
            deleteApprovedRecipes: args.deleteApprovedRecipes,
            expiresAt,
        });
    },
});

export const completeAccountDeletion = internalMutation({
    args: {
        userId: v.string(),
    },
    handler: async (ctx, args) => {
        const deletionRequest = await ctx.db
            .query("accountDeletionRequests")
            .withIndex("by_userId", index => index.eq("userId", args.userId))
            .first();
        const deleteApprovedRecipes = deletionRequest !== null && deletionRequest.expiresAt > Date.now()
            ? deletionRequest.deleteApprovedRecipes
            : false;
        const [fridgeProducts, favorites, comments, blogFavorites, blogComments, submissions, blogSubmissions, publicProfile, commentReportsByReporter, pendingVideos, pendingImages, pendingAvatars, commentRateLimit] = await Promise.all([
            ctx.db
                .query("fridgeProducts")
                .withIndex("by_user_createdAt", index => index.eq("userId", args.userId))
                .collect(),
            ctx.db
                .query("favoriteRecipes")
                .withIndex("by_user_createdAt", index => index.eq("userId", args.userId))
                .collect(),
            ctx.db
                .query("comments")
                .withIndex("by_authorId", index => index.eq("authorId", args.userId))
                .collect(),
            ctx.db
                .query("blogFavorites")
                .withIndex("by_user_createdAt", index => index.eq("userId", args.userId))
                .collect(),
            ctx.db
                .query("blogComments")
                .withIndex("by_authorId", index => index.eq("authorId", args.userId))
                .collect(),
            ctx.db
                .query("recipeSubmissions")
                .withIndex("by_author_createdAt", index => index.eq("authorId", args.userId))
                .collect(),
            ctx.db
                .query("blogSubmissions")
                .withIndex("by_author_createdAt", index => index.eq("authorId", args.userId))
                .collect(),
            ctx.db
                .query("publicProfiles")
                .withIndex("by_userId", index => index.eq("userId", args.userId))
                .unique(),
            ctx.db
                .query("commentReports")
                .withIndex("by_reporterId", index => index.eq("reporterId", args.userId))
                .collect(),
            ctx.db
                .query("pendingVideoUploads")
                .withIndex("by_ownerId", index => index.eq("ownerId", args.userId))
                .collect(),
            ctx.db
                .query("pendingImageUploads")
                .withIndex("by_ownerId", index => index.eq("ownerId", args.userId))
                .collect(),
            ctx.db
                .query("pendingAvatarUploads")
                .withIndex("by_ownerId", index => index.eq("ownerId", args.userId))
                .collect(),
            ctx.db
                .query("commentRateLimits")
                .withIndex("by_userId", index => index.eq("userId", args.userId))
                .unique(),
        ]);
        const approvedRecipeIds = [...new Set(
            submissions.flatMap(submission =>
                submission.status === "approved" && submission.reviewedRecipeId
                    ? [submission.reviewedRecipeId]
                    : [],
            ),
        )];
        const approvedBlogIds = [...new Set(
            blogSubmissions.flatMap(submission =>
                submission.status === "approved" && submission.reviewedBlogId
                    ? [submission.reviewedBlogId]
                    : [],
            ),
        )];

        if (deleteApprovedRecipes) {
            await Promise.all(approvedRecipeIds.map(recipeId => deletePublicRecipe(ctx, recipeId)));
        } else {
            await Promise.all(approvedRecipeIds.map(async recipeId => {
                const recipe = await ctx.db.get(recipeId);

                if (recipe) {
                    await ctx.db.patch(recipeId, {
                        authorId: "GotujTo",
                        authorName: "GotujTo",
                        authorUserId: undefined,
                    });
                }
            }));
        }

        // Wpisy blogowe nie sa objete opcja usuniecia przepisow. Po usunieciu
        // konta zachowujemy zatwierdzony wpis, ale usuwamy powiazanie z profilem.
        await Promise.all(approvedBlogIds.map(async blogId => {
            const blog = await ctx.db.get(blogId);

            if (blog) {
                await ctx.db.patch(blogId, {
                    authorName: "GotujTo",
                    authorUserId: undefined,
                });
            }
        }));

        const deletedRecipeIds = new Set(deleteApprovedRecipes ? approvedRecipeIds : []);
        const favoritesToDelete = favorites.filter(favorite => !deletedRecipeIds.has(favorite.recipeId));
        const commentsToDelete = comments.filter(comment => !deletedRecipeIds.has(comment.recipeId));
        const reportsForDeletedComments = await Promise.all([
            ...commentsToDelete.map(comment => ctx.db
                .query("commentReports")
                .withIndex("by_target", index =>
                    index.eq("targetType", "recipe").eq("commentId", comment._id),
                )
                .collect()),
            ...blogComments.map(comment => ctx.db
                .query("commentReports")
                .withIndex("by_target", index =>
                    index.eq("targetType", "blog").eq("commentId", comment._id),
                )
                .collect()),
        ]);
        const commentReportsToDelete = [...new Map(
            [...commentReportsByReporter, ...reportsForDeletedComments.flat()]
                .map(report => [report._id, report]),
        ).values()];
        const videoKeysToCleanup = [...new Set([
            ...pendingVideos.map(upload => upload.videoKey),
            ...pendingAvatars.map(upload => upload.avatarKey),
            ...(publicProfile ? [getAvatarKeyFromUrl(publicProfile.image)] : []),
            ...submissions.flatMap(submission => {
                const shouldDeleteVideo = submission.status !== "approved" || !submission.reviewedRecipeId;

                return shouldDeleteVideo ? [submission.recipeData?.videoKey] : [];
            }),
            ...blogSubmissions.flatMap(submission => {
                const shouldDeleteVideo = submission.status !== "approved" || !submission.reviewedBlogId;

                return shouldDeleteVideo ? [submission.videoKey] : [];
            }),
        ])].filter((videoKey): videoKey is string => typeof videoKey === "string");
        const favoriteRemovalsByRecipeId = new Map<Id<"recipes">, number>();
        const commentRemovalsByRecipeId = new Map<Id<"recipes">, number>();
        const favoriteRemovalsByBlogId = new Map<Id<"blog">, number>();
        const commentRemovalsByBlogId = new Map<Id<"blog">, number>();

        for (const favorite of favoritesToDelete) {
            favoriteRemovalsByRecipeId.set(
                favorite.recipeId,
                (favoriteRemovalsByRecipeId.get(favorite.recipeId) ?? 0) + 1,
            );
        }

        for (const comment of commentsToDelete) {
            commentRemovalsByRecipeId.set(
                comment.recipeId,
                (commentRemovalsByRecipeId.get(comment.recipeId) ?? 0) + 1,
            );
        }

        for (const favorite of blogFavorites) {
            favoriteRemovalsByBlogId.set(
                favorite.blogId,
                (favoriteRemovalsByBlogId.get(favorite.blogId) ?? 0) + 1,
            );
        }

        for (const comment of blogComments) {
            commentRemovalsByBlogId.set(
                comment.blogId,
                (commentRemovalsByBlogId.get(comment.blogId) ?? 0) + 1,
            );
        }

        const favoriteCountUpdates = [...favoriteRemovalsByRecipeId.entries()].map(async ([recipeId, removals]) => {
            const recipe = await ctx.db.get(recipeId);

            if (!recipe) {
                return;
            }

            const favoriteCount = recipe.favoriteCount ?? 0;

            await ctx.db.patch(recipeId, {
                favoriteCount: Math.max(favoriteCount - removals, 0),
            });
        });
        const commentCountUpdates = [...commentRemovalsByRecipeId.entries()].map(async ([recipeId, removals]) => {
            const recipe = await ctx.db.get(recipeId);

            if (!recipe) {
                return;
            }

            const commentCount = recipe.commentCount ?? 0;

            await ctx.db.patch(recipeId, {
                commentCount: Math.max(commentCount - removals, 0),
            });
        });
        const blogFavoriteCountUpdates = [...favoriteRemovalsByBlogId.entries()].map(async ([blogId, removals]) => {
            const blog = await ctx.db.get(blogId);

            if (!blog) {
                return;
            }

            const favoriteCount = blog.favoriteCount ?? 0;

            await ctx.db.patch(blogId, {
                favoriteCount: Math.max(favoriteCount - removals, 0),
            });
        });
        const blogCommentCountUpdates = [...commentRemovalsByBlogId.entries()].map(async ([blogId, removals]) => {
            const blog = await ctx.db.get(blogId);

            if (!blog) {
                return;
            }

            const commentCount = blog.commentCount ?? 0;

            await ctx.db.patch(blogId, {
                commentCount: Math.max(commentCount - removals, 0),
            });
        });

        await Promise.all([
            ...fridgeProducts.map(entry => ctx.db.delete(entry._id)),
            ...favoritesToDelete.map(favorite => ctx.db.delete(favorite._id)),
            ...commentsToDelete.map(comment => ctx.db.delete(comment._id)),
            ...blogFavorites.map(favorite => ctx.db.delete(favorite._id)),
            ...blogComments.map(comment => ctx.db.delete(comment._id)),
            ...commentReportsToDelete.map(report => ctx.db.delete(report._id)),
            ...pendingVideos.map(upload => ctx.db.delete(upload._id)),
            ...pendingImages.flatMap(upload => [
                ctx.storage.delete(upload.storageId),
                ctx.db.delete(upload._id),
            ]),
            ...pendingAvatars.map(upload => ctx.db.delete(upload._id)),
            ...favoriteCountUpdates,
            ...commentCountUpdates,
            ...blogFavoriteCountUpdates,
            ...blogCommentCountUpdates,
            ...submissions.flatMap(submission => {
                const shouldDeleteImages = submission.status !== "approved" || !submission.reviewedRecipeId;

                return [
                    ctx.db.delete(submission._id),
                    ...(shouldDeleteImages && submission.recipeData
                        ? submission.recipeData.images.map(imageId => ctx.storage.delete(imageId))
                        : []),
                ];
            }),
            ...blogSubmissions.flatMap(submission => {
                const shouldDeleteImages = submission.status !== "approved" || !submission.reviewedBlogId;

                return [
                    ctx.db.delete(submission._id),
                    ...(shouldDeleteImages
                        ? submission.images.map(imageId => ctx.storage.delete(imageId))
                        : []),
                ];
            }),
            ...videoKeysToCleanup.map(videoKey => enqueueVideoCleanup(ctx, videoKey)),
            ...(deletionRequest ? [ctx.db.delete(deletionRequest._id)] : []),
            ...(publicProfile ? [ctx.db.delete(publicProfile._id)] : []),
            ...(commentRateLimit ? [ctx.db.delete(commentRateLimit._id)] : []),
        ]);
    },
});

export const getRecipeSubmissions = query({
    args: {},
    handler: async (ctx) => {
        const user = await authComponent.getAuthUser(ctx);

        if (!user) {
            return [];
        }

        return await ctx.db
            .query("recipeSubmissions")
            .withIndex("by_author_createdAt", index => index.eq("authorId", user._id))
            .order("desc")
            .take(50);
    },
});

export const generateRecipeSubmissionImageUploadUrl = mutation({
    args: {
        contentType: v.string(),
        size: v.number(),
    },
    handler: async (ctx, args) => {
        await requireUser(ctx);

        if (!allowedSubmissionImageTypes.has(args.contentType)) {
            throw new ConvexError({
                code: "INVALID_IMAGE",
                message: "Dozwolone formaty zdjec: JPG, PNG i WebP.",
            });
        }

        if (!Number.isSafeInteger(args.size) || args.size <= 0 || args.size > MAX_SUBMISSION_IMAGE_SIZE) {
            throw new ConvexError({
                code: "INVALID_IMAGE",
                message: "Zdjecie moze miec maksymalnie 10 MB.",
            });
        }

        return await ctx.storage.generateUploadUrl();
    },
});

export const generateBlogSubmissionImageUploadUrl = mutation({
    args: {
        contentType: v.string(),
        size: v.number(),
    },
    handler: async (ctx, args) => {
        await requireUser(ctx);

        if (!allowedSubmissionImageTypes.has(args.contentType)) {
            throw new ConvexError({
                code: "INVALID_IMAGE",
                message: "Dozwolone formaty zdjec: JPG, PNG i WebP.",
            });
        }

        if (!Number.isSafeInteger(args.size) || args.size <= 0 || args.size > MAX_SUBMISSION_IMAGE_SIZE) {
            throw new ConvexError({
                code: "INVALID_IMAGE",
                message: "Zdjecie moze miec maksymalnie 10 MB.",
            });
        }

        return await ctx.storage.generateUploadUrl();
    },
});

export const registerPendingSubmissionImage = mutation({
    args: {
        storageId: v.id("_storage"),
    },
    handler: async (ctx, args) => {
        const user = await requireUser(ctx);
        await validateSubmissionImages(ctx, [args.storageId]);
        const existingUpload = await ctx.db
            .query("pendingImageUploads")
            .withIndex("by_storageId", index => index.eq("storageId", args.storageId))
            .unique();

        if (existingUpload) {
            if (existingUpload.ownerId !== user._id) {
                throw new ConvexError({
                    code: "INVALID_IMAGE",
                    message: "Zdjecie nalezy do innego konta.",
                });
            }

            return;
        }

        await ctx.db.insert("pendingImageUploads", {
            storageId: args.storageId,
            ownerId: user._id,
            createdAt: Date.now(),
        });
    },
});

export const registerPendingSubmissionVideo = mutation({
    args: {
        videoKey: v.string(),
        purpose: v.union(v.literal("recipe"), v.literal("blog")),
    },
    handler: async (ctx, args) => {
        const user = await requireUser(ctx);

        if (!isSubmissionVideoKey(args.videoKey, args.purpose)) {
            throw new ConvexError({
                code: "INVALID_VIDEO",
                message: "Nieprawidlowy film zgloszenia.",
            });
        }

        const existingUpload = await ctx.db
            .query("pendingVideoUploads")
            .withIndex("by_videoKey", index => index.eq("videoKey", args.videoKey))
            .unique();

        if (existingUpload) {
            if (existingUpload.ownerId !== user._id) {
                throw new ConvexError({
                    code: "INVALID_VIDEO",
                    message: "Film nalezy do innego konta.",
                });
            }

            return;
        }

        await ctx.db.insert("pendingVideoUploads", {
            videoKey: args.videoKey,
            ownerId: user._id,
            createdAt: Date.now(),
        });
    },
});

export const registerPendingAvatarUpload = mutation({
    args: {
        avatarKey: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await requireUser(ctx);

        if (!args.avatarKey.startsWith("avatars/") || args.avatarKey.length > 300) {
            throw new ConvexError({
                code: "INVALID_IMAGE",
                message: "Nieprawidlowy avatar.",
            });
        }

        const existingUpload = await ctx.db
            .query("pendingAvatarUploads")
            .withIndex("by_avatarKey", index => index.eq("avatarKey", args.avatarKey))
            .unique();

        if (existingUpload) {
            if (existingUpload.ownerId !== user._id) {
                throw new ConvexError({
                    code: "INVALID_IMAGE",
                    message: "Avatar nalezy do innego konta.",
                });
            }

            return;
        }

        await ctx.db.insert("pendingAvatarUploads", {
            avatarKey: args.avatarKey,
            ownerId: user._id,
            createdAt: Date.now(),
        });
    },
});

export const createRecipeSubmission = mutation({
    args: {
        recipe: submissionRecipeDataV,
    },
    handler: async (ctx, args) => {
        const user = await requireUser(ctx);
        await upsertPublicProfile(ctx, user);
        const pendingSubmissions = await ctx.db
            .query("recipeSubmissions")
            .withIndex("by_author_createdAt", index => index.eq("authorId", user._id))
            .filter(query => query.eq(query.field("status"), "pending"))
            .take(MAX_PENDING_RECIPE_SUBMISSIONS);

        if (pendingSubmissions.length >= MAX_PENDING_RECIPE_SUBMISSIONS) {
            throw new ConvexError({
                code: "SUBMISSION_LIMIT_REACHED",
                message: "Mozesz miec maksymalnie 10 przepisow oczekujacych na weryfikacje.",
            });
        }

        const recipe = args.recipe;
        const name = requireText(recipe.name, "nazwa", 120);
        const description = recipe.description.trim();
        const recipeSteps = recipe.recipeSteps.map(step => ({
            description: requireText(step.description, "krok przygotowania", 2_000),
        }));
        const ingredients = recipe.ingredientGroups.flatMap(group => [
            group.main,
            ...group.substitutes,
        ]);

        if (description.length > 2_000) {
            throw new ConvexError({
                code: "INVALID_INPUT",
                message: "Opis przepisu jest za dlugi.",
            });
        }

        if (!Number.isInteger(recipe.cookingMinutes) || recipe.cookingMinutes < 1 || recipe.cookingMinutes > 1_440) {
            throw new ConvexError({
                code: "INVALID_INPUT",
                message: "Podaj prawidlowy czas przygotowania.",
            });
        }

        if (!Number.isInteger(recipe.servings) || recipe.servings < 1 || recipe.servings > 100) {
            throw new ConvexError({
                code: "INVALID_INPUT",
                message: "Podaj prawidlowa liczbe porcji.",
            });
        }

        if (recipe.ingredientGroups.length === 0 || ingredients.length > 100) {
            throw new ConvexError({
                code: "INVALID_INPUT",
                message: "Dodaj od 1 do 100 skladnikow.",
            });
        }

        if (recipeSteps.length === 0 || recipeSteps.length > 30) {
            throw new ConvexError({
                code: "INVALID_INPUT",
                message: "Dodaj od 1 do 30 krokow przygotowania.",
            });
        }

        if (ingredients.some(ingredient =>
            !Number.isFinite(ingredient.metricQuantity) ||
            ingredient.metricQuantity <= 0 ||
            !Number.isFinite(ingredient.customaryQuantity) ||
            ingredient.customaryQuantity <= 0,
        )) {
            throw new ConvexError({
                code: "INVALID_INPUT",
                message: "Podaj prawidlowe ilosci skladnikow.",
            });
        }

        await validateSubmissionImages(ctx, recipe.images);
        validateRecipeSubmissionVideoKey(recipe.videoKey);

        const productNames = new Map<string, string>();

        for (const productId of new Set(ingredients.map(ingredient => ingredient.productId))) {
            const product = await ctx.db.get(productId);

            if (!product) {
                throw new ConvexError({
                    code: "PRODUCT_NOT_FOUND",
                    message: "Jeden z wybranych produktow juz nie istnieje.",
                });
            }

            productNames.set(productId, product.name);
        }

        const legacyIngredients = recipe.ingredientGroups.map(group => {
            const productName = productNames.get(group.main.productId) ?? "produkt";

            return `${group.main.metricQuantity} ${group.main.metricUnit} ${productName}`;
        });
        const authorName = typeof user.name === "string" && user.name.trim()
            ? user.name.trim().slice(0, 120)
            : "Uzytkownik GotujTo";

        await consumePendingSubmissionImages(ctx, user._id, recipe.images);
        await consumePendingSubmissionVideo(ctx, user._id, recipe.videoKey);

        const now = Date.now();

        return await ctx.db.insert("recipeSubmissions", {
            authorId: user._id,
            authorName,
            name,
            description,
            cookingMinutes: recipe.cookingMinutes,
            servings: recipe.servings,
            ingredients: legacyIngredients,
            steps: recipeSteps.map(step => step.description),
            recipeData: {
                ...recipe,
                name,
                description,
                recipeSteps,
            },
            status: "pending",
            createdAt: now,
            updatedAt: now,
        });
    },
});

export const deleteRecipeSubmission = mutation({
    args: {
        submissionId: v.id("recipeSubmissions"),
    },
    handler: async (ctx, args) => {
        const user = await requireUser(ctx);
        const submission = await ctx.db.get(args.submissionId);

        if (!submission || submission.authorId !== user._id) {
            throw new ConvexError({
                code: "SUBMISSION_NOT_FOUND",
                message: "Nie znaleziono zgloszenia przepisu.",
            });
        }

        if (submission.status !== "pending") {
            throw new ConvexError({
                code: "SUBMISSION_NOT_EDITABLE",
                message: "Mozesz usunac tylko oczekujace zgloszenie.",
            });
        }

        if (submission.recipeData) {
            await Promise.all(
                submission.recipeData.images.map(imageId => ctx.storage.delete(imageId)),
            );
        }

        await ctx.db.delete(submission._id);

        return {videoKey: submission.recipeData?.videoKey ?? null};
    },
});

export const getBlogSubmissions = query({
    args: {},
    handler: async (ctx) => {
        const user = await authComponent.getAuthUser(ctx);

        if (!user) {
            return [];
        }

        return await ctx.db
            .query("blogSubmissions")
            .withIndex("by_author_createdAt", index => index.eq("authorId", user._id))
            .order("desc")
            .take(50);
    },
});

export const createBlogSubmission = mutation({
    args: {
        title: v.string(),
        description: v.string(),
        type: v.union(v.literal("tip"), v.literal("article"), v.literal("joke")),
        images: v.array(v.id("_storage")),
        videoKey: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await requireUser(ctx);
        await upsertPublicProfile(ctx, user);
        const title = requireText(args.title, "tytul", 160);
        const description = requireText(args.description, "tresc wpisu", 20_000);

        await validateOptionalSubmissionImages(ctx, args.images, 4);
        validateBlogSubmissionVideoKey(args.videoKey);

        const authorName = typeof user.name === "string" && user.name.trim()
            ? user.name.trim().slice(0, 120)
            : "Uzytkownik GotujTo";

        await consumePendingSubmissionImages(ctx, user._id, args.images);
        await consumePendingSubmissionVideo(ctx, user._id, args.videoKey);
        const now = Date.now();

        return await ctx.db.insert("blogSubmissions", {
            authorId: user._id,
            authorName,
            title,
            description,
            type: args.type,
            images: args.images,
            videoKey: args.videoKey,
            status: "pending",
            createdAt: now,
            updatedAt: now,
        });
    },
});

export const deleteBlogSubmission = mutation({
    args: {
        submissionId: v.id("blogSubmissions"),
    },
    handler: async (ctx, args) => {
        const user = await requireUser(ctx);
        const submission = await ctx.db.get(args.submissionId);

        if (!submission || submission.authorId !== user._id) {
            throw new ConvexError({
                code: "SUBMISSION_NOT_FOUND",
                message: "Nie znaleziono zgloszenia wpisu.",
            });
        }

        if (submission.status !== "pending") {
            throw new ConvexError({
                code: "SUBMISSION_NOT_EDITABLE",
                message: "Mozesz usunac tylko oczekujacy wpis.",
            });
        }

        await Promise.all(submission.images.map(imageId => ctx.storage.delete(imageId)));
        await ctx.db.delete(submission._id);

        return {videoKey: submission.videoKey ?? null};
    },
});

export const getRecipeSubmissionsForAdmin = query({
    args: {
        adminSecret: v.string(),
        status: v.union(
            v.literal("pending"),
            v.literal("approved"),
            v.literal("rejected"),
        ),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        requireAdmin(args.adminSecret);

        const limit = Math.min(Math.max(Math.floor(args.limit ?? 50), 1), 50);
        const submissions = await ctx.db
            .query("recipeSubmissions")
            .withIndex("by_status_createdAt", index => index.eq("status", args.status))
            .order("desc")
            .take(limit);

        return submissions.map(submission => ({
            _id: submission._id,
            name: submission.name,
            authorName: submission.authorName ?? "Uzytkownik GotujTo",
            cookingMinutes: submission.cookingMinutes,
            servings: submission.servings,
            status: submission.status,
            createdAt: submission.createdAt,
            reviewedRecipeId: submission.reviewedRecipeId,
            hasCompleteRecipeData: submission.recipeData !== undefined,
        }));
    },
});

export const getRecipeSubmissionForAdmin = query({
    args: {
        adminSecret: v.string(),
        submissionId: v.id("recipeSubmissions"),
    },
    handler: async (ctx, args) => {
        requireAdmin(args.adminSecret);

        const submission = await ctx.db.get(args.submissionId);

        if (!submission || !submission.recipeData) {
            return null;
        }

        const recipeData = submission.recipeData;
        const productIds = [...new Set(recipeData.ingredientGroups.flatMap(group => [
            group.main.productId,
            ...group.substitutes.map(substitute => substitute.productId),
        ]))];
        const products = await Promise.all(productIds.map(productId => ctx.db.get(productId)));
        const productNames = new Map(
            products
                .filter((product): product is Doc<"products"> => product !== null)
                .map(product => [product._id, product.name]),
        );
        const imageUrls = await Promise.all(recipeData.images.map(imageId => ctx.storage.getUrl(imageId)));

        return {
            _id: submission._id,
            authorName: submission.authorName ?? "Uzytkownik GotujTo",
            status: submission.status,
            adminNote: submission.adminNote,
            createdAt: submission.createdAt,
            reviewedRecipeId: submission.reviewedRecipeId,
            recipe: {
                name: recipeData.name,
                description: recipeData.description,
                cookingMinutes: recipeData.cookingMinutes,
                servings: recipeData.servings,
                diets: recipeData.diets,
                types: recipeData.types,
                occasions: recipeData.occasions,
                images: recipeData.images.flatMap((imageId, index) => {
                    const url = imageUrls[index];

                    return url ? [{storageId: imageId, url}] : [];
                }),
                videoUrl: getPublicVideoUrl(recipeData.videoKey),
                ingredientGroups: recipeData.ingredientGroups.map(group => ({
                    main: {
                        ...group.main,
                        productName: productNames.get(group.main.productId) ?? "Usuniety produkt",
                    },
                    substitutes: group.substitutes.map(substitute => ({
                        ...substitute,
                        productName: productNames.get(substitute.productId) ?? "Usuniety produkt",
                    })),
                })),
                steps: recipeData.recipeSteps,
            },
        };
    },
});

export const approveRecipeSubmission = mutation({
    args: {
        adminSecret: v.string(),
        submissionId: v.id("recipeSubmissions"),
    },
    handler: async (ctx, args) => {
        requireAdmin(args.adminSecret);

        const submission = await ctx.db.get(args.submissionId);

        if (!submission || !submission.recipeData) {
            throw new ConvexError({
                code: "SUBMISSION_NOT_FOUND",
                message: "Nie znaleziono kompletnego zgloszenia przepisu.",
            });
        }

        if (submission.status !== "pending") {
            throw new ConvexError({
                code: "SUBMISSION_NOT_PENDING",
                message: "To zgloszenie zostalo juz rozpatrzone.",
            });
        }

        const recipeData = submission.recipeData;
        await validateSubmissionImages(ctx, recipeData.images);
        validateRecipeSubmissionVideoKey(recipeData.videoKey);

        const authorName = submission.authorName ?? "Uzytkownik GotujTo";
        const recipeId = await ctx.db.insert("recipes", {
            name: recipeData.name,
            description: recipeData.description || undefined,
            cookingMinutes: recipeData.cookingMinutes,
            servings: recipeData.servings,
            authorId: authorName,
            authorName,
            authorUserId: submission.authorId,
            favorite: 0,
            favoriteCount: 0,
            commentCount: 0,
            images: recipeData.images,
            videoKey: recipeData.videoKey,
            diets: recipeData.diets,
            types: recipeData.types,
            occasions: recipeData.occasions,
            requiredIngredientGroups: recipeData.ingredientGroups.length,
        });

        await ctx.db.patch(recipeId, {
            feedRank: getSubmissionFeedRank(recipeId),
        });

        const ingredients = recipeData.ingredientGroups.flatMap((group, groupIndex) => [
            {
                recipeId,
                ...group.main,
                substitutionGroup: groupIndex,
                groupLevel: 0,
                requiredIngredientGroups: recipeData.ingredientGroups.length,
            },
            ...group.substitutes.map((substitute, substituteIndex) => ({
                recipeId,
                ...substitute,
                substitutionGroup: groupIndex,
                groupLevel: substituteIndex + 1,
                requiredIngredientGroups: recipeData.ingredientGroups.length,
            })),
        ]);

        await Promise.all([
            ...ingredients.map(ingredient => ctx.db.insert("ingredients", ingredient)),
            ...recipeData.recipeSteps.map((step, index) => ctx.db.insert("steps", {
                recipeId,
                stepNum: index + 1,
                description: step.description,
            })),
        ]);

        const now = Date.now();
        await ctx.db.patch(submission._id, {
            status: "approved",
            reviewedRecipeId: recipeId,
            reviewedAt: now,
            updatedAt: now,
        });

        await ctx.scheduler.runAfter(0, internal.indexNow.submitUrls,
            {
                urls: [`https://gotujto.com/recipe/${recipeId}`],
            },
        );

        return recipeId;
    },
});

export const rejectRecipeSubmission = mutation({
    args: {
        adminSecret: v.string(),
        submissionId: v.id("recipeSubmissions"),
        adminNote: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        requireAdmin(args.adminSecret);

        const submission = await ctx.db.get(args.submissionId);

        if (!submission) {
            throw new ConvexError({
                code: "SUBMISSION_NOT_FOUND",
                message: "Nie znaleziono zgloszenia przepisu.",
            });
        }

        if (submission.status !== "pending") {
            throw new ConvexError({
                code: "SUBMISSION_NOT_PENDING",
                message: "To zgloszenie zostalo juz rozpatrzone.",
            });
        }

        const adminNote = args.adminNote?.trim();

        if (adminNote && adminNote.length > 500) {
            throw new ConvexError({
                code: "INVALID_INPUT",
                message: "Notatka administratora moze miec maksymalnie 500 znakow.",
            });
        }

        const now = Date.now();
        await ctx.db.patch(submission._id, {
            status: "rejected",
            adminNote: adminNote || undefined,
            reviewedAt: now,
            updatedAt: now,
        });

        return {videoKey: submission.recipeData?.videoKey ?? null};
    },
});

export const getBlogSubmissionsForAdmin = query({
    args: {
        adminSecret: v.string(),
        status: v.union(
            v.literal("pending"),
            v.literal("approved"),
            v.literal("rejected"),
        ),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        requireAdmin(args.adminSecret);

        const limit = Math.min(Math.max(Math.floor(args.limit ?? 50), 1), 50);
        const submissions = await ctx.db
            .query("blogSubmissions")
            .withIndex("by_status_createdAt", index => index.eq("status", args.status))
            .order("desc")
            .take(limit);

        return submissions.map(submission => ({
            _id: submission._id,
            title: submission.title,
            type: submission.type,
            authorName: submission.authorName ?? "Uzytkownik GotujTo",
            status: submission.status,
            createdAt: submission.createdAt,
            reviewedBlogId: submission.reviewedBlogId,
        }));
    },
});

export const getBlogSubmissionForAdmin = query({
    args: {
        adminSecret: v.string(),
        submissionId: v.id("blogSubmissions"),
    },
    handler: async (ctx, args) => {
        requireAdmin(args.adminSecret);

        const submission = await ctx.db.get(args.submissionId);

        if (!submission) {
            return null;
        }

        const imageUrls = await Promise.all(
            submission.images.map(imageId => ctx.storage.getUrl(imageId)),
        );

        const {videoKey, ...submissionData} = submission;

        return {
            ...submissionData,
            authorName: submission.authorName ?? "Uzytkownik GotujTo",
            images: imageUrls.filter((url): url is string => url !== null),
            videoUrl: getPublicVideoUrl(videoKey),
        };
    },
});

export const approveBlogSubmission = mutation({
    args: {
        adminSecret: v.string(),
        submissionId: v.id("blogSubmissions"),
    },
    handler: async (ctx, args) => {
        requireAdmin(args.adminSecret);

        const submission = await ctx.db.get(args.submissionId);

        if (!submission) {
            throw new ConvexError({
                code: "SUBMISSION_NOT_FOUND",
                message: "Nie znaleziono zgloszenia wpisu.",
            });
        }

        if (submission.status !== "pending") {
            throw new ConvexError({
                code: "SUBMISSION_NOT_PENDING",
                message: "To zgloszenie zostalo juz rozpatrzone.",
            });
        }

        await validateOptionalSubmissionImages(ctx, submission.images, 4);
        validateBlogSubmissionVideoKey(submission.videoKey);

        const now = Date.now();
        const blogId = await ctx.db.insert("blog", {
            title: submission.title,
            description: submission.description,
            authorName: submission.authorName ?? "Uzytkownik GotujTo",
            authorUserId: submission.authorId,
            type: submission.type,
            images: submission.images,
            videoKey: submission.videoKey,
            active: true,
            publishedAt: now,
            favoriteCount: 0,
            commentCount: 0,
            feedRank: getSubmissionFeedRank(`blog:${submission._id}`),
        });

        await ctx.db.patch(submission._id, {
            status: "approved",
            reviewedBlogId: blogId,
            reviewedAt: now,
            updatedAt: now,
        });

        return blogId;
    },
});

export const rejectBlogSubmission = mutation({
    args: {
        adminSecret: v.string(),
        submissionId: v.id("blogSubmissions"),
        adminNote: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        requireAdmin(args.adminSecret);

        const submission = await ctx.db.get(args.submissionId);

        if (!submission) {
            throw new ConvexError({
                code: "SUBMISSION_NOT_FOUND",
                message: "Nie znaleziono zgloszenia wpisu.",
            });
        }

        if (submission.status !== "pending") {
            throw new ConvexError({
                code: "SUBMISSION_NOT_PENDING",
                message: "To zgloszenie zostalo juz rozpatrzone.",
            });
        }

        const adminNote = args.adminNote?.trim();

        if (adminNote && adminNote.length > 500) {
            throw new ConvexError({
                code: "INVALID_INPUT",
                message: "Notatka administratora moze miec maksymalnie 500 znakow.",
            });
        }

        const now = Date.now();
        await ctx.db.patch(submission._id, {
            status: "rejected",
            adminNote: adminNote || undefined,
            reviewedAt: now,
            updatedAt: now,
        });

        return {videoKey: submission.videoKey ?? null};
    },
});

export const enqueueVideoCleanupForAdmin = mutation({
    args: {
        adminSecret: v.string(),
        videoKey: v.string(),
    },
    handler: async (ctx, args) => {
        requireAdmin(args.adminSecret);
        await enqueueVideoCleanup(ctx, args.videoKey);
    },
});

export const moveStalePendingVideoUploadsToCleanup = mutation({
    args: {
        adminSecret: v.string(),
        before: v.number(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        requireAdmin(args.adminSecret);
        const limit = Math.min(Math.max(Math.floor(args.limit ?? 50), 1), 100);
        const uploads = await ctx.db
            .query("pendingVideoUploads")
            .withIndex("by_createdAt", index => index.lte("createdAt", args.before))
            .take(limit);

        await Promise.all(uploads.flatMap(upload => [
            enqueueVideoCleanup(ctx, upload.videoKey),
            ctx.db.delete(upload._id),
        ]));

        return uploads.length;
    },
});

export const cleanupStalePendingImageUploadsForAdmin = mutation({
    args: {
        adminSecret: v.string(),
        before: v.number(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        requireAdmin(args.adminSecret);
        const limit = Math.min(Math.max(Math.floor(args.limit ?? 50), 1), 100);
        const uploads = await ctx.db
            .query("pendingImageUploads")
            .withIndex("by_createdAt", index => index.lte("createdAt", args.before))
            .take(limit);

        await Promise.all(uploads.flatMap(upload => [
            ctx.storage.delete(upload.storageId),
            ctx.db.delete(upload._id),
        ]));

        return uploads.length;
    },
});

export const moveStalePendingAvatarUploadsToCleanup = mutation({
    args: {
        adminSecret: v.string(),
        before: v.number(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        requireAdmin(args.adminSecret);
        const limit = Math.min(Math.max(Math.floor(args.limit ?? 50), 1), 100);
        const uploads = await ctx.db
            .query("pendingAvatarUploads")
            .withIndex("by_createdAt", index => index.lte("createdAt", args.before))
            .take(limit);

        await Promise.all(uploads.flatMap(upload => [
            enqueueVideoCleanup(ctx, upload.avatarKey),
            ctx.db.delete(upload._id),
        ]));

        return uploads.length;
    },
});

export const getMediaCleanupBatchForAdmin = query({
    args: {
        adminSecret: v.string(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        requireAdmin(args.adminSecret);
        const limit = Math.min(Math.max(Math.floor(args.limit ?? 50), 1), 100);

        return await ctx.db
            .query("mediaCleanupQueue")
            .withIndex("by_createdAt")
            .order("asc")
            .take(limit);
    },
});

export const resolveMediaCleanupBatchForAdmin = mutation({
    args: {
        adminSecret: v.string(),
        deletedIds: v.array(v.id("mediaCleanupQueue")),
        failedIds: v.array(v.id("mediaCleanupQueue")),
    },
    handler: async (ctx, args) => {
        requireAdmin(args.adminSecret);
        const now = Date.now();

        await Promise.all([
            ...args.deletedIds.map(id => ctx.db.delete(id)),
            ...args.failedIds.map(async id => {
                const entry = await ctx.db.get(id);

                if (entry) {
                    await ctx.db.patch(id, {
                        attempts: entry.attempts + 1,
                        lastAttemptAt: now,
                    });
                }
            }),
        ]);
    },
});

export const getCommentReportsForAdmin = query({
    args: {
        adminSecret: v.string(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        requireAdmin(args.adminSecret);
        const limit = Math.min(Math.max(Math.floor(args.limit ?? 50), 1), 100);
        const reports = await ctx.db
            .query("commentReports")
            .withIndex("by_createdAt")
            .order("desc")
            .take(500);
        const groupedReports = new Map<string, {
            targetType: CommentTargetType;
            commentId: string;
            count: number;
            latestReportedAt: number;
        }>();

        for (const report of reports) {
            const key = `${report.targetType}:${report.commentId}`;
            const existing = groupedReports.get(key);

            if (existing) {
                existing.count += 1;
                continue;
            }

            groupedReports.set(key, {
                targetType: report.targetType,
                commentId: report.commentId,
                count: 1,
                latestReportedAt: report.createdAt,
            });
        }

        const rows = await Promise.all(
            [...groupedReports.values()].slice(0, limit).map(async group => {
                if (group.targetType === "recipe") {
                    const comment = await ctx.db.get(group.commentId as Id<"comments">);

                    if (!comment) {
                        return null;
                    }

                    const recipe = await ctx.db.get(comment.recipeId);

                    return {
                        ...group,
                        content: comment.content,
                        authorName: comment.authorName,
                        commentCreatedAt: comment.createdAt,
                        parentId: comment.recipeId,
                        parentName: recipe?.name ?? "Usuniety przepis",
                    };
                }

                const comment = await ctx.db.get(group.commentId as Id<"blogComments">);

                if (!comment) {
                    return null;
                }

                const blog = await ctx.db.get(comment.blogId);

                return {
                    ...group,
                    content: comment.content,
                    authorName: comment.authorName,
                    commentCreatedAt: comment.createdAt,
                    parentId: comment.blogId,
                    parentName: blog?.title ?? "Usuniety wpis",
                };
            }),
        );

        return rows.filter((row): row is NonNullable<typeof row> => row !== null);
    },
});

export const dismissCommentReports = mutation({
    args: {
        adminSecret: v.string(),
        targetType: v.union(v.literal("recipe"), v.literal("blog")),
        commentId: v.string(),
    },
    handler: async (ctx, args) => {
        requireAdmin(args.adminSecret);
        const reports = await ctx.db
            .query("commentReports")
            .withIndex("by_target", index =>
                index.eq("targetType", args.targetType).eq("commentId", args.commentId),
            )
            .collect();

        await Promise.all(reports.map(report => ctx.db.delete(report._id)));
    },
});

export const deleteReportedComment = mutation({
    args: {
        adminSecret: v.string(),
        targetType: v.union(v.literal("recipe"), v.literal("blog")),
        commentId: v.string(),
    },
    handler: async (ctx, args) => {
        requireAdmin(args.adminSecret);
        const reports = await ctx.db
            .query("commentReports")
            .withIndex("by_target", index =>
                index.eq("targetType", args.targetType).eq("commentId", args.commentId),
            )
            .collect();

        if (args.targetType === "recipe") {
            const comment = await ctx.db.get(args.commentId as Id<"comments">);

            if (!comment) {
                await Promise.all(reports.map(report => ctx.db.delete(report._id)));
                return;
            }

            const recipe = await ctx.db.get(comment.recipeId);
            await Promise.all([
                ctx.db.delete(comment._id),
                ...reports.map(report => ctx.db.delete(report._id)),
                ...(recipe ? [ctx.db.patch(recipe._id, {
                    commentCount: Math.max((recipe.commentCount ?? 0) - 1, 0),
                })] : []),
            ]);
            return;
        }

        const comment = await ctx.db.get(args.commentId as Id<"blogComments">);

        if (!comment) {
            await Promise.all(reports.map(report => ctx.db.delete(report._id)));
            return;
        }

        const blog = await ctx.db.get(comment.blogId);
        await Promise.all([
            ctx.db.delete(comment._id),
            ...reports.map(report => ctx.db.delete(report._id)),
            ...(blog ? [ctx.db.patch(blog._id, {
                commentCount: Math.max((blog.commentCount ?? 0) - 1, 0),
            })] : []),
        ]);
    },
});

export const requestEmailChange = mutation({
    args: {
        newEmail: v.string(),
        callbackURL: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await requireUser(ctx);
        const newEmail = args.newEmail.trim().toLowerCase();

        if (!/^\S+@\S+\.\S+$/.test(newEmail)) {
            throw new ConvexError({
                code: "INVALID_EMAIL",
                message: "Podaj prawidlowy adres e-mail.",
            });
        }

        const {auth, headers} = await authComponent.getAuth(createAuth, ctx);

        await auth.api.changeEmail({
            body: {
                newEmail,
                callbackURL: args.callbackURL ?? "/profile",
            },
            headers,
        });
    },
});
