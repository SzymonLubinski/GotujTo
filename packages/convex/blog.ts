import {paginationOptsValidator} from "convex/server";
import {v} from "convex/values";
import {query, type QueryCtx} from "./_generated/server";
import {type Doc} from "./_generated/dataModel";

const BLOG_SHORT_EXCERPT_LENGTH = 360;

export const getBlogContentPaginated = query({
    args: {
        paginationOpts: paginationOptsValidator,
    },

    handler: async (ctx, args) => {
        const result = await ctx.db
            .query("blog")
            .withIndex("by_active_publishedAt", index => index.eq("active", true))
            .order("desc")
            .paginate(args.paginationOpts);

        return {
            ...result,
            page: await Promise.all(result.page.map(item => toBlogContent(ctx, item))),
        };
    },
});

export const getBlogShortsPaginated = query({
    args: {
        paginationOpts: paginationOptsValidator,
        randomSeed: v.string(),
        createdBefore: v.number(),
    },
    handler: async (ctx, args) => {
        const hasRankedBlog = await ctx.db
            .query("blog")
            .withIndex("by_active_feedRank", index =>
                index
                    .eq("active", true)
                    .gte("feedRank", 0),
            )
            .first();

        const hasLegacyBlog = await ctx.db
            .query("blog")
            .withIndex("by_active_feedRank", index =>
                index
                    .eq("active", true)
                    .eq("feedRank", undefined),
            )
            .first();

        if (!hasRankedBlog || hasLegacyBlog) {
            return await getLegacyBlogShortPage(ctx, args);
        }

        const feedCursor = parseFeedCursor(args.paginationOpts.cursor);
        const rankAnchor = getSeededScore("blog-feed-anchor", args.randomSeed);
        const isWrapping = feedCursor?.phase === "before";
        const paginationOpts = {
            ...args.paginationOpts,
            cursor: feedCursor?.cursor ?? null,
        };
        const blogQuery = isWrapping
            ? ctx.db
                .query("blog")
                .withIndex("by_active_feedRank", index =>
                    index
                        .eq("active", true)
                        .gte("feedRank", 0)
                        .lt("feedRank", rankAnchor),
                )
            : ctx.db
                .query("blog")
                .withIndex("by_active_feedRank", index =>
                    index
                        .eq("active", true)
                        .gte("feedRank", rankAnchor),
                );
        const pageBlogs = await blogQuery
            .filter(filter => filter.lte(filter.field("_creationTime"), args.createdBefore))
            .paginate(paginationOpts);

        let isDone = pageBlogs.isDone;
        let continueCursor = pageBlogs.continueCursor;

        if (!isWrapping && pageBlogs.isDone) {
            isDone = false;
            continueCursor = stringifyFeedCursor({
                phase: "before",
                cursor: null,
            });
        } else if (!isWrapping && !pageBlogs.isDone) {
            continueCursor = stringifyFeedCursor({
                phase: "after",
                cursor: pageBlogs.continueCursor,
            });
        } else if (isWrapping && !pageBlogs.isDone) {
            continueCursor = stringifyFeedCursor({
                phase: "before",
                cursor: pageBlogs.continueCursor,
            });
        }

        return {
            page: await Promise.all(pageBlogs.page.map(item => toBlogShort(ctx, item))),
            isDone,
            continueCursor,
        };
    },
});

export const getBlogById = query({
    args: {
        blogId: v.id("blog"),
    },
    handler: async (ctx, args) => {
        const blog = await ctx.db.get(args.blogId);

        if (!blog || !blog.active) {
            return null;
        }

        return await toBlogContent(ctx, blog);
    },
});

async function getLegacyBlogShortPage(
    ctx: QueryCtx,
    args: {
        paginationOpts: {
            cursor: string | null;
            numItems: number;
        };
        randomSeed: string;
        createdBefore: number;
    },
) {
    const blogs = (await ctx.db
        .query("blog")
        .withIndex("by_active_publishedAt", index => index.eq("active", true))
        .collect())
        .filter(blog => blog._creationTime <= args.createdBefore)
        .sort((first, second) => {
            const firstScore = getSeededScore(args.randomSeed, first._id);
            const secondScore = getSeededScore(args.randomSeed, second._id);

            return firstScore - secondScore || first._id.localeCompare(second._id);
        });
    const parsedOffset = args.paginationOpts.cursor
        ? Number.parseInt(args.paginationOpts.cursor, 10)
        : 0;
    const offset = Number.isSafeInteger(parsedOffset) && parsedOffset >= 0
        ? parsedOffset
        : 0;
    const pageBlogs = blogs.slice(offset, offset + args.paginationOpts.numItems);

    return {
        page: await Promise.all(pageBlogs.map(item => toBlogShort(ctx, item))),
        isDone: offset + pageBlogs.length >= blogs.length,
        continueCursor: String(offset + pageBlogs.length),
    };
}

async function toBlogContent(ctx: QueryCtx, blog: Doc<"blog">) {
    const {videoKey, ...blogContent} = blog;

    return {
        ...blogContent,
        authorName: blog.authorName ?? "GotujTo",
        images: await getImageUrls(ctx, blog),
        videoUrl: getPublicVideoUrl(videoKey),
    };
}

async function toBlogShort(ctx: QueryCtx, blog: Doc<"blog">) {
    return {
        _id: blog._id,
        _creationTime: blog._creationTime,
        title: blog.title,
        excerpt: createExcerpt(blog.description),
        authorName: blog.authorName ?? "GotujTo",
        authorUserId: blog.authorUserId,
        type: blog.type,
        images: await getImageUrls(ctx, blog),
        videoUrl: getPublicVideoUrl(blog.videoKey),
        publishedAt: blog.publishedAt,
        favoriteCount: blog.favoriteCount ?? 0,
        commentCount: blog.commentCount ?? 0,
    };
}

function getPublicVideoUrl(videoKey: string | undefined) {
    const publicUrl = process.env.R2_PUBLIC_URL;

    return videoKey && publicUrl
        ? `${publicUrl}/${videoKey}`
        : undefined;
}

async function getImageUrls(ctx: QueryCtx, blog: Doc<"blog">) {
    const imageUrls = await Promise.all(blog.images.map(imageId => ctx.storage.getUrl(imageId)));

    return imageUrls.filter((url): url is string => url !== null);
}

function createExcerpt(description: string) {
    if (description.length <= BLOG_SHORT_EXCERPT_LENGTH) {
        return description;
    }

    const cutoff = description.lastIndexOf(" ", BLOG_SHORT_EXCERPT_LENGTH);
    const end = cutoff > 0 ? cutoff : BLOG_SHORT_EXCERPT_LENGTH;

    return `${description.slice(0, end).trimEnd()}...`;
}

function getSeededScore(seed: string, value: string) {
    const input = `${seed}:${value}`;
    let hash = 2166136261;

    for (let index = 0; index < input.length; index++) {
        hash ^= input.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }

    return hash >>> 0;
}

type FeedCursor = {
    phase: "after" | "before";
    cursor: string | null;
};

function parseFeedCursor(cursor: string | null): FeedCursor | null {
    if (!cursor) {
        return null;
    }

    try {
        const parsed = JSON.parse(cursor) as Partial<FeedCursor>;

        if (
            (parsed.phase !== "after" && parsed.phase !== "before")
            || (parsed.cursor !== null && typeof parsed.cursor !== "string")
        ) {
            return null;
        }

        return {
            phase: parsed.phase,
            cursor: parsed.cursor,
        };
    } catch {
        return null;
    }
}

function stringifyFeedCursor(cursor: FeedCursor) {
    return JSON.stringify(cursor);
}
