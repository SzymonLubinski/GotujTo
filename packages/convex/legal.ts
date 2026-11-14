import {ConvexError, v} from "convex/values";
import {mutation, query} from "./_generated/server";
import {authComponent} from "./auth";
import {TERMS_VERSION} from "../shared/data/legal";

export const recordTermsAcceptance = mutation({
    args: {
        accepted: v.literal(true),
    },
    handler: async ctx => {
        let user;

        try {
            user = await authComponent.getAuthUser(ctx);
        } catch {
            user = null;
        }

        if (!user) {
            throw new ConvexError({
                code: "UNAUTHENTICATED",
                message: "Zaloguj sie, aby potwierdzic Regulamin.",
            });
        }

        const acceptances = await ctx.db
            .query("termsAcceptances")
            .withIndex("by_userId", index => index.eq("userId", user._id))
            .collect();
        const existing = acceptances.find(acceptance => acceptance.termsVersion === TERMS_VERSION)
            ?? acceptances.sort((first, second) => second.acceptedAt - first.acceptedAt)[0];

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
        try {
            // Po usunieciu konta klient moze jeszcze przez chwile wyslac
            // poprzedni token. Ta bramka jest tylko odczytem UI, wiec taki
            // stan traktujemy jak wylogowanie zamiast zwracac Server Error.
            const user = await authComponent.getAuthUser(ctx);

            if (!user) {
                return false;
            }

            const acceptances = await ctx.db
                .query("termsAcceptances")
                .withIndex("by_userId", index => index.eq("userId", user._id))
                .collect();

            return acceptances.some(acceptance => acceptance.termsVersion === TERMS_VERSION);
        } catch {
            return false;
        }
    },
});
