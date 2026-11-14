import {ConvexError, v} from "convex/values";
import {action, internalAction, internalMutation, internalQuery, mutation, query} from "./_generated/server";
import {api, internal} from "./_generated/api";
import {authComponent} from "./auth";
import {requireAdmin} from "./lib/requireAdmin";
import {stores} from "../shared/data/stableData";
import {getIngredientLabel} from "../shared/functions/getIngredientLabel";

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

function formatSavings(value: number) {
    return new Intl.NumberFormat("pl-PL", {
        style: "currency",
        currency: "PLN",
        minimumFractionDigits: value % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2,
    }).format(value);
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

        const highlights = await ctx.runQuery(api.recipes.getRecipesByDeals, {
            stores: [...stores],
            limit: 3,
        });
        const recipients = args.recipients ?? await ctx.runQuery(internal.notifications.getNewsletterRecipients, {});

        if (!highlights.length || !recipients.length) return {sent: 0, failed: 0};

        const recipeRows = highlights.map(item => {
            const recipeUrl = `https://gotujto.com/recipe/${item.recipe._id}`;
            const imageUrl = item.recipe.images[0];
            const savings = item.thrift > 0
                ? `<p style="margin:0 0 8px;color:#65a30d;font-weight:700">Taniej do ${escapeHtml(formatSavings(item.thrift))}!</p>`
                : "";
            const image = imageUrl
                ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(item.recipe.name)}" width="560" style="display:block;width:100%;max-width:560px;height:180px;object-fit:cover;border-radius:12px;margin:0 0 14px" />`
                : "";

            return `<li style="list-style:none;margin:0 0 20px;padding:18px;border:1px solid #e4e4e7;border-radius:16px">${image}<a href="${recipeUrl}" style="color:#18181b;font-size:18px;font-weight:700;text-decoration:none">${escapeHtml(item.recipe.name)}</a><p style="margin:10px 0 8px;color:#52525b">W promocji: ${item.dealIngredientCount} ${getIngredientLabel(item.dealIngredientCount)}</p>${savings}<a href="${recipeUrl}" style="color:#65a30d;font-weight:700">Zobacz przepis</a></li>`;
        }).join("");
        const textRecipes = highlights.map(item => {
            const savings = item.thrift > 0 ? `, Taniej do ${formatSavings(item.thrift)}!` : "";
            return `- ${item.recipe.name} (W promocji: ${item.dealIngredientCount} ${getIngredientLabel(item.dealIngredientCount)}${savings})\n  https://gotujto.com/recipe/${item.recipe._id}`;
        }).join("\n");
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
                    htmlContent: `<main style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#18181b"><img src="https://gotujto.com/images/brand/gotujto-logo-light.png" alt="GotujTo" width="180" style="display:block;width:180px;height:auto;margin:0 0 24px" /><p>${greeting}</p><p>Wybraliśmy przepisy, których składniki są teraz w promocji.</p><ul style="padding:0;margin:24px 0">${recipeRows}</ul><p style="margin-top:28px;font-size:12px;color:#71717a">Jeśli nie chcesz już otrzymywać takich wiadomości, możesz <a href="${unsubscribeUrl}" style="color:#65a30d">zrezygnować z newslettera</a>.</p></main>`,
                    textContent: `${recipient.name ? `Cześć ${recipient.name}!` : "Cześć!"}\n\nWybraliśmy przepisy, których składniki są teraz w promocji:\n${textRecipes}\n\nJeśli nie chcesz już otrzymywać takich wiadomości, możesz zrezygnować z newslettera: ${unsubscribeUrl}`,
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
