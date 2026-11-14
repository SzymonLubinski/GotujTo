import {ConvexError, v} from "convex/values";
import {action, internalAction, internalMutation, internalQuery, mutation, query} from "./_generated/server";
import {internal} from "./_generated/api";
import {authComponent} from "./auth";
import {requireAdmin} from "./lib/requireAdmin";

async function requireUser(ctx: Parameters<typeof authComponent.getAuthUser>[0]) {
    const user = await authComponent.getAuthUser(ctx);

    if (!user) {
        throw new ConvexError({
            code: "UNAUTHENTICATED",
            message: "Zaloguj się, aby zmienić ustawienia powiadomień.",
        });
    }

    return user;
}

const preferenceArgs = {
    emailNewsletterEnabled: v.boolean(),
    pushEnabled: v.boolean(),
};

export const getPreferences = query({
    args: {},
    handler: async ctx => {
        const user = await authComponent.getAuthUser(ctx);
        if (!user) return null;

        return await ctx.db
            .query("notificationPreferences")
            .withIndex("by_userId", index => index.eq("userId", user._id))
            .unique();
    },
});

export const updatePreferences = mutation({
    args: preferenceArgs,
    handler: async (ctx, args) => {
        const user = await requireUser(ctx);
        const existing = await ctx.db
            .query("notificationPreferences")
            .withIndex("by_userId", index => index.eq("userId", user._id))
            .unique();
        const value = {...args, updatedAt: Date.now()};

        if (existing) {
            await ctx.db.patch(existing._id, value);
        } else {
            await ctx.db.insert("notificationPreferences", {userId: user._id, ...value});
        }

        const recipient = await ctx.db
            .query("newsletterRecipients")
            .withIndex("by_userId", index => index.eq("userId", user._id))
            .unique();

        if (!args.emailNewsletterEnabled) {
            if (recipient) await ctx.db.delete(recipient._id);
            return;
        }

        const email = user.email.trim().toLowerCase();
        const name = typeof user.name === "string" && user.name.trim() ? user.name.trim().slice(0, 120) : undefined;
        const recipientValue = {email, name, updatedAt: Date.now()};

        if (recipient) {
            await ctx.db.patch(recipient._id, recipientValue);
        } else {
            await ctx.db.insert("newsletterRecipients", {
                userId: user._id,
                ...recipientValue,
                unsubscribeToken: crypto.randomUUID(),
            });
        }
    },
});

export const unsubscribeWithToken = internalMutation({
    args: {token: v.string()},
    handler: async (ctx, args) => {
        const recipient = await ctx.db
            .query("newsletterRecipients")
            .withIndex("by_unsubscribeToken", index => index.eq("unsubscribeToken", args.token))
            .unique();
        if (!recipient) return false;

        const preference = await ctx.db
            .query("notificationPreferences")
            .withIndex("by_userId", index => index.eq("userId", recipient.userId))
            .unique();

        if (preference) {
            await ctx.db.patch(preference._id, {
                emailNewsletterEnabled: false,
                updatedAt: Date.now(),
            });
        }
        await ctx.db.delete(recipient._id);
        return true;
    },
});

export const registerPushToken = mutation({
    args: {
        token: v.string(),
        platform: v.union(v.literal("android"), v.literal("ios")),
    },
    handler: async (ctx, args) => {
        const user = await requireUser(ctx);
        const token = args.token.trim();

        if (!/^ExponentPushToken\[[^\]]+\]$|^ExpoPushToken\[[^\]]+\]$/.test(token)) {
            throw new ConvexError({code: "INVALID_PUSH_TOKEN", message: "Nieprawidłowy token powiadomień."});
        }

        const existing = await ctx.db
            .query("pushSubscriptions")
            .withIndex("by_user_token", index => index.eq("userId", user._id).eq("token", token))
            .unique();
        const value = {platform: args.platform, updatedAt: Date.now()};

        if (existing) {
            await ctx.db.patch(existing._id, value);
        } else {
            await ctx.db.insert("pushSubscriptions", {userId: user._id, token, ...value});
        }
    },
});

export const getPushTokensForUser = internalQuery({
    args: {userId: v.string()},
    handler: async (ctx, args) => {
        const preference = await ctx.db
            .query("notificationPreferences")
            .withIndex("by_userId", index => index.eq("userId", args.userId))
            .unique();

        if (!preference?.pushEnabled) return [];

        return await ctx.db
            .query("pushSubscriptions")
            .withIndex("by_userId", index => index.eq("userId", args.userId))
            .collect();
    },
});

export const getPushRecipients = internalQuery({
    args: {},
    handler: async ctx => {
        const preferences = await ctx.db.query("notificationPreferences").collect();
        const enabledUserIds = preferences.filter(preference => preference.pushEnabled).map(preference => preference.userId);
        const subscriptions = await Promise.all(enabledUserIds.map(userId => ctx.db
            .query("pushSubscriptions")
            .withIndex("by_userId", index => index.eq("userId", userId))
            .collect()));

        return subscriptions.flat();
    },
});

const notificationArgs = {
    title: v.string(),
    body: v.string(),
    path: v.optional(v.string()),
};

async function deliver(tokens: string[], notification: {title: string; body: string; path?: string}) {
    if (!tokens.length) return {delivered: 0};

    const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(tokens.slice(0, 100).map(to => ({
            to,
            sound: "default",
            title: notification.title,
            body: notification.body,
            ...(notification.path ? {data: {path: notification.path}} : {}),
        }))),
    });

    if (!response.ok) {
        console.error("Push: Expo odrzuciło wysyłkę.", {status: response.status});
        return {delivered: 0};
    }

    return {delivered: Math.min(tokens.length, 100)};
}

export const sendToUser = internalAction({
    args: {userId: v.string(), ...notificationArgs},
    handler: async (ctx, args): Promise<{delivered: number}> => {
        const subscriptions: {token: string}[] = await ctx.runQuery(internal.notifications.getPushTokensForUser, {userId: args.userId});
        return await deliver(subscriptions.map(subscription => subscription.token), args);
    },
});

export const getPromotionHighlight = internalQuery({
    args: {},
    handler: async ctx => {
        const now = Date.now();
        const activeDeals = (await ctx.db.query("deals").collect())
            .filter(deal => deal.startsAt <= now && deal.endsAt >= now)
            .slice(0, 60);

        for (const deal of activeDeals) {
            const ingredient = await ctx.db
                .query("ingredients")
                .withIndex("by_productId", index => index.eq("productId", deal.productId))
                .first();
            if (!ingredient) continue;

            const recipe = await ctx.db.get(ingredient.recipeId);
            if (recipe) return {recipeId: recipe._id, name: recipe.name};
        }

        return null;
    },
});

export const getPromotionHighlights = internalQuery({
    args: {},
    handler: async ctx => {
        const now = Date.now();
        const activeDeals = (await ctx.db.query("deals").collect())
            .filter(deal => deal.startsAt <= now && deal.endsAt >= now)
            .slice(0, 100);
        const seenRecipeIds = new Set<string>();
        const highlights: {recipeId: string; name: string}[] = [];

        for (const deal of activeDeals) {
            if (highlights.length >= 3) break;
            const ingredient = await ctx.db
                .query("ingredients")
                .withIndex("by_productId", index => index.eq("productId", deal.productId))
                .first();
            if (!ingredient || seenRecipeIds.has(ingredient.recipeId)) continue;

            const recipe = await ctx.db.get(ingredient.recipeId);
            if (!recipe) continue;

            seenRecipeIds.add(recipe._id);
            highlights.push({recipeId: recipe._id, name: recipe.name});
        }

        return highlights;
    },
});

export const getNewsletterRecipients = internalQuery({
    args: {},
    handler: async ctx => await ctx.db.query("newsletterRecipients").collect(),
});

export const getNewsletterRecipientForEmail = internalQuery({
    args: {email: v.string()},
    handler: async (ctx, args) => await ctx.db
        .query("newsletterRecipients")
        .withIndex("by_email", index => index.eq("email", args.email))
        .unique(),
});

function escapeHtml(value: string) {
    return value.replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#039;",
    })[character] ?? character);
}

export const sendPromotionNewsletter = internalAction({
    args: {
        recipients: v.optional(v.array(v.object({
            email: v.string(),
            name: v.optional(v.string()),
            unsubscribeToken: v.string(),
        }))),
    },
    handler: async (ctx, args): Promise<{sent: number; failed: number}> => {
        const apiKey = process.env.BREVO_API_KEY?.trim();
        const from = process.env.BREVO_FROM_EMAIL?.trim();
        const siteUrl = process.env.CONVEX_SITE_URL?.trim();

        if (!apiKey || !from || !siteUrl) {
            console.warn("Newsletter: brakuje konfiguracji Brevo.");
            return {sent: 0, failed: 0};
        }

        const highlights = await ctx.runQuery(internal.notifications.getPromotionHighlights, {});
        const recipients = args.recipients ?? await ctx.runQuery(internal.notifications.getNewsletterRecipients, {});

        if (!highlights.length || !recipients.length) return {sent: 0, failed: 0};

        const recipeRows = highlights.map(recipe => `<li style="margin:0 0 12px"><a href="https://gotujto.com/recipe/${recipe.recipeId}" style="color:#65a30d;font-weight:700">${escapeHtml(recipe.name)}</a></li>`).join("");
        const textRecipes = highlights.map(recipe => `- ${recipe.name}: https://gotujto.com/recipe/${recipe.recipeId}`).join("\n");
        const results = await Promise.all(recipients.map(async recipient => {
            const unsubscribeUrl = `${siteUrl}/newsletter/unsubscribe?token=${encodeURIComponent(recipient.unsubscribeToken)}`;
            const greeting = recipient.name ? `Cześć ${escapeHtml(recipient.name)}!` : "Cześć!";
            const response = await fetch("https://api.brevo.com/v3/smtp/email", {
                method: "POST",
                headers: {
                    "api-key": apiKey,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    sender: {name: "GotujTo", email: from},
                    to: [{email: recipient.email, ...(recipient.name ? {name: recipient.name} : {})}],
                    subject: "Pomysły z aktualnych promocji | GotujTo",
                    htmlContent: `<main style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#18181b"><h1 style="color:#65a30d">GotujTo</h1><p>${greeting}</p><p>Wybraliśmy przepisy, których składniki są teraz w promocji.</p><ol>${recipeRows}</ol><p style="margin-top:28px;font-size:12px;color:#71717a"><a href="${unsubscribeUrl}">Wypisz się z newslettera</a></p></main>`,
                    textContent: `${recipient.name ? `Cześć ${recipient.name}!` : "Cześć!"}\n\nWybraliśmy przepisy, których składniki są teraz w promocji:\n${textRecipes}\n\nWypisz się: ${unsubscribeUrl}`,
                    headers: {"List-Unsubscribe": `<${unsubscribeUrl}>`},
                }),
            });

            return response.ok;
        }));

        const sent = results.filter(Boolean).length;
        const failed = results.length - sent;
        if (failed) console.error("Newsletter: część wiadomości Brevo nie została wysłana.", {failed});
        return {sent, failed};
    },
});

const TEST_NEWSLETTER_RECIPIENT = "szymon.lubinski.it@gmail.com";

export const sendTestNewsletter = action({
    args: {adminSecret: v.string()},
    handler: async (ctx, args): Promise<{sent: number; failed: number}> => {
        requireAdmin(args.adminSecret);
        const recipient = await ctx.runQuery(internal.notifications.getNewsletterRecipientForEmail, {
            email: TEST_NEWSLETTER_RECIPIENT,
        });

        if (!recipient) {
            throw new ConvexError({
                code: "NEWSLETTER_NOT_ENABLED",
                message: "Adres testowy nie ma aktywnej zgody na newsletter.",
            });
        }

        const result = await ctx.runAction(internal.notifications.sendPromotionNewsletter, {
            recipients: [{
                email: recipient.email,
                ...(recipient.name ? {name: recipient.name} : {}),
                unsubscribeToken: recipient.unsubscribeToken,
            }],
        });

        return result;
    },
});

export const sendPromotionHighlights = internalAction({
    args: {},
    handler: async (ctx): Promise<{delivered: number}> => {
        const [highlight, subscriptions]: [
            {recipeId: string; name: string} | null,
            {token: string}[],
        ] = await Promise.all([
            ctx.runQuery(internal.notifications.getPromotionHighlight, {}),
            ctx.runQuery(internal.notifications.getPushRecipients, {}),
        ]);
        if (!highlight) return {delivered: 0};

        return await deliver(subscriptions.map(subscription => subscription.token), {
            title: "Pomysł z promocji",
            body: highlight.name,
            path: `/recipe/${highlight.recipeId}`,
        });
    },
});
