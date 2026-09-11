// noinspection JSUnusedGlobalSymbols

import {mutation, query} from "./_generated/server";
import {v} from "convex/values";
import {productTypes} from "../shared/data/stableData"

export const checkProductExists = query({
    args: { name: v.string() },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("products")
            .withIndex("by_name", (q) => q.eq("name", args.name))
            .collect();

        return existing.length > 0;
    },
});

export const createProduct = mutation({
    args: {
        name: v.string(),
        image: v.optional(v.id("_storage")),
        type: v.union(...productTypes.map((type) => v.literal(type)))
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("products", {
            name: args.name,
            image: args.image,
            type: args.type,
        });
    }
})

export const searchProducts = query({
    args: {
        phrase: v.string()
    },
    handler: async (ctx, {phrase}) => {
        const normalizedPhrase = phrase.trim();
        if (normalizedPhrase.length < 2) return [];
        return await ctx.db
            .query("products")
            .withSearchIndex("search_name", (q) => q.search("name", normalizedPhrase))
            .take(10)
    }
})

export const exportProducts = query({
    args: {},
    handler: async ctx => {
        return await ctx.db
            .query("products")
            .collect();
    },
});