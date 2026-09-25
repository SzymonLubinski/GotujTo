import {internalMutation, mutation} from "./_generated/server";
import {internal} from "./_generated/api";
import {ConvexError, v} from "convex/values";

const HOUR_MS = 60 * 60 * 1_000;
const DAY_MS = 24 * HOUR_MS;
const MAX_HOURLY_SUBMISSIONS = 3;
const MAX_DAILY_SUBMISSIONS = 10;

function requireRateLimitSecret(rateLimitSecret: string) {
    const expectedSecret = process.env.CONTACT_RATE_LIMIT_SECRET;

    if (!expectedSecret || rateLimitSecret !== expectedSecret) {
        throw new ConvexError({
            code: "UNAUTHORIZED",
            message: "Brak uprawnień do użycia limitu formularza.",
        });
    }
}

function retryAfterSeconds(windowStartedAt: number, windowMs: number, now: number) {
    return Math.max(
        1,
        Math.ceil((windowStartedAt + windowMs - now) / 1_000),
    );
}

export const consume = mutation({
    args: {
        key: v.string(),
        now: v.number(),
        rateLimitSecret: v.string(),
    },
    handler: async (ctx, args) => {
        requireRateLimitSecret(args.rateLimitSecret);

        const existing = await ctx.db
            .query("contactRateLimits")
            .withIndex("by_key", query => query.eq("key", args.key))
            .unique();

        let hourStartedAt = args.now;
        let hourlySubmissions = 0;
        let dayStartedAt = args.now;
        let dailySubmissions = 0;
        let expiresAt = args.now + DAY_MS;
        let scheduleCleanup = false;

        if (existing) {
            hourStartedAt = existing.hourStartedAt;
            hourlySubmissions = existing.hourlySubmissions;
            dayStartedAt = existing.dayStartedAt;
            dailySubmissions = existing.dailySubmissions;
            expiresAt = existing.expiresAt;

            if (args.now - hourStartedAt >= HOUR_MS) {
                hourStartedAt = args.now;
                hourlySubmissions = 0;
            }

            if (args.now - dayStartedAt >= DAY_MS) {
                dayStartedAt = args.now;
                dailySubmissions = 0;
                expiresAt = args.now + DAY_MS;
                scheduleCleanup = true;
            }
        }

        if (hourlySubmissions >= MAX_HOURLY_SUBMISSIONS) {
            return {
                allowed: false,
                retryAfterSeconds: retryAfterSeconds(
                    hourStartedAt,
                    HOUR_MS,
                    args.now,
                ),
            };
        }

        if (dailySubmissions >= MAX_DAILY_SUBMISSIONS) {
            return {
                allowed: false,
                retryAfterSeconds: retryAfterSeconds(
                    dayStartedAt,
                    DAY_MS,
                    args.now,
                ),
            };
        }

        hourlySubmissions += 1;
        dailySubmissions += 1;

        if (existing) {
            await ctx.db.patch(existing._id, {
                hourStartedAt,
                hourlySubmissions,
                dayStartedAt,
                dailySubmissions,
                expiresAt,
            });

            if (scheduleCleanup) {
                await ctx.scheduler.runAt(
                    expiresAt,
                    internal.contactRateLimits.deleteIfExpired,
                    {
                        rateLimitId: existing._id,
                        expectedExpiresAt: expiresAt,
                    },
                );
            }
        } else {
            const rateLimitId = await ctx.db.insert("contactRateLimits", {
                key: args.key,
                hourStartedAt,
                hourlySubmissions,
                dayStartedAt,
                dailySubmissions,
                expiresAt,
            });

            await ctx.scheduler.runAt(
                expiresAt,
                internal.contactRateLimits.deleteIfExpired,
                {
                    rateLimitId,
                    expectedExpiresAt: expiresAt,
                },
            );
        }

        return {allowed: true};
    },
});

export const deleteIfExpired = internalMutation({
    args: {
        rateLimitId: v.id("contactRateLimits"),
        expectedExpiresAt: v.number(),
    },
    handler: async (ctx, args) => {
        const rateLimit = await ctx.db.get(args.rateLimitId);

        if (
            rateLimit &&
            rateLimit.expiresAt <= args.expectedExpiresAt
        ) {
            await ctx.db.delete(rateLimit._id);
        }
    },
});
