import {ConvexError, v} from "convex/values";
import {mutation, query} from "./_generated/server";
import {authComponent} from "./auth";
import {TERMS_VERSION} from "../shared/data/legal";

export const recordTermsAcceptance = mutation({
    args: {
        accepted: v.literal(true),
    },
    handler: async ctx => {
        const user = await authComponent.getAuthUser(ctx);

        if (!user) {
            throw new ConvexError({
                code: "UNAUTHENTICATED",
                message: "Zaloguj sie, aby potwierdzic Regulamin.",
            });
        }

        const existing = await ctx.db
            .query("termsAcceptances")
            .withIndex("by_userId", index => index.eq("userId", user._id))
            .unique();

        if (existing?.termsVersion === TERMS_VERSION) {
            return;
        }

        const acceptance = {
            userId: user._id,
            termsVersion: TERMS_VERSION,
            acceptedAt: Date.now(),
        };

        if (existing) {
            await ctx.db.patch(existing._id, acceptance);
            return;
        }

        await ctx.db.insert("termsAcceptances", acceptance);
    },
});

export const hasAcceptedTerms = query({
    args: {},
    handler: async ctx => {
        const user = await authComponent.getAuthUser(ctx);

        if (!user) {
            return false;
        }

        const acceptance = await ctx.db
            .query("termsAcceptances")
            .withIndex("by_userId", index => index.eq("userId", user._id))
            .unique();

        return acceptance?.termsVersion === TERMS_VERSION;
    },
});
