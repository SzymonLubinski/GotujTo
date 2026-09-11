// noinspection JSUnusedGlobalSymbols

import {internalMutation, mutation, query} from "./_generated/server";
import {v} from "convex/values";
import {internal} from "./_generated/api";
import {stores} from "../shared/data/stableData"


export const createDeals = mutation({
    args: {
        deals: v.array(v.object({
            productId: v.id("products"),
            store: v.union(...stores.map((store) => v.literal(store))),
            dealPrice: v.number(),
            lowerBy: v.number(),
            regularPrice: v.number(),
            startsAt: v.number(),
            endsAt: v.number(),
        }))
    },
    handler: async (ctx, args) => {
        for (const deal of args.deals) {
            const dealId = await ctx.db.insert("deals", deal);
            await ctx.scheduler.runAt(
                deal.endsAt,
                internal.deals.deleteExpired,
                {dealId}
            )
        }
    }
})

export const deleteExpired = internalMutation({
    args: {dealId: v.id("deals")},
    handler: async (ctx, args) => {
        await ctx.db.delete("deals", args.dealId)
    }
})

export const getDealsByStore = query({
    args: {stores: v.array(v.union(...stores.map((store) => v.literal(store))))},
    handler: async (ctx, args) => {
        const selectedStores = args.stores.length > 0
            ? [...new Set(args.stores)]
            : [...stores]

        return (
            await Promise.all(
                selectedStores.map(store =>
                    ctx.db
                        .query("deals")
                        .withIndex("by_store", q => q.eq("store", store))
                        .collect()
                )
            )
        ).flat()
    }
})