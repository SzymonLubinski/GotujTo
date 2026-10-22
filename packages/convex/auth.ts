import {createClient, type GenericCtx} from "@convex-dev/better-auth";
import {convex, crossDomain} from "@convex-dev/better-auth/plugins";
import {requireRunMutationCtx} from "@convex-dev/better-auth/utils";
import {betterAuth, type BetterAuthOptions} from "better-auth/minimal";
import {expo} from "@better-auth/expo";

import {components, internal} from "./_generated/api";
import type {DataModel} from "./_generated/dataModel";
import {query} from "./_generated/server";
import authConfig from "./auth.config";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

async function sendVerificationEmail({
    email,
    name,
    verificationUrl,
}: {
    email: string;
    name: string;
    verificationUrl: string;
}) {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;

    if (!apiKey || !from) {
        throw new Error("Brakuje konfiguracji wysyłki e-maili aktywacyjnych.");
    }

    const greetingName = name ? ` ${name}` : "";
    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from,
            to: [email],
            subject: "Potwierdź adres e-mail w GotujTo",
            text: `Cześć${greetingName}!\n\nPotwierdź swój adres e-mail w GotujTo, otwierając link:\n${verificationUrl}\n\nJeśli nie zakładałeś konta, zignoruj tę wiadomość.`,
            html: `<p>Cześć${greetingName}!</p><p>Potwierdź swój adres e-mail w GotujTo:</p><p><a href="${verificationUrl}">Aktywuj konto</a></p><p>Jeśli nie zakładałeś konta, zignoruj tę wiadomość.</p>`,
        }),
    });

    if (!response.ok) {
        console.error("Nie udało się wysłać e-maila aktywacyjnego.", {
            status: response.status,
        });
        throw new Error("Nie udało się wysłać e-maila aktywacyjnego.");
    }
}

async function sendPasswordResetEmail({
    email,
    name,
    resetUrl,
}: {
    email: string;
    name: string;
    resetUrl: string;
}) {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;

    if (!apiKey || !from) {
        throw new Error("Brakuje konfiguracji wysylki e-maili resetujacych haslo.");
    }

    const greetingName = name ? ` ${name}` : "";
    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from,
            to: [email],
            subject: "Reset hasla w GotujTo",
            text: `Czesc${greetingName}!\n\nAby ustawic nowe haslo do GotujTo, otworz link:\n${resetUrl}\n\nJesli nie prosiles o reset hasla, zignoruj te wiadomosc.`,
            html: `<p>Czesc${greetingName}!</p><p>Aby ustawic nowe haslo do GotujTo, otworz ponizszy link:</p><p><a href="${resetUrl}">Ustaw nowe haslo</a></p><p>Jesli nie prosiles o reset hasla, zignoruj te wiadomosc.</p>`,
        }),
    });

    if (!response.ok) {
        console.error("Nie udalo sie wyslac e-maila resetujacego haslo.", {
            status: response.status,
        });
        throw new Error("Nie udalo sie wyslac e-maila resetujacego haslo.");
    }
}

export const authComponent = createClient<DataModel>(components.betterAuth);

export const createAuthOptions = (ctx: GenericCtx<DataModel>) =>
    ({
        appName: "GotujTo",
        // Expo Web calls Better Auth directly on the Convex site. The fallback
        // preserves the existing local web setup until the backend provides its
        // canonical site URL.
        baseURL: process.env.CONVEX_SITE_URL ?? process.env.SITE_URL,
        trustedOrigins: [
            ...(process.env.SITE_URL ? [process.env.SITE_URL] : []),
            // Expo Web runs locally on port 8081. These origins are needed
            // for the browser's CORS preflight before calling the Convex site.
            "http://localhost:8081",
            "http://127.0.0.1:8081",
            "mobile://",
        ],
        secret: process.env.BETTER_AUTH_SECRET,
        database: authComponent.adapter(ctx),
        rateLimit: {
            enabled: true,
            storage: "database",
            window: 60,
            max: 30,
            customRules: {
                "/sign-up/email": {
                    window: 60 * 60,
                    max: 2,
                },
                "/sign-in/email": {
                    window: 30 * 60,
                    max: 10,
                },
                "/request-password-reset": {
                    window: 60 * 60,
                    max: 3,
                },
                "/send-verification-email": {
                    window: 60 * 60,
                    max: 3,
                },
            },
        },
        emailAndPassword: {
            enabled: true,
            maxPasswordLength: 128,
            minPasswordLength: 8,
            requireEmailVerification: true,
            revokeSessionsOnPasswordReset: true,
            sendResetPassword: async ({user, url}) => {
                await sendPasswordResetEmail({
                    email: user.email,
                    name: user.name,
                    resetUrl: url,
                });
            },
        },
        emailVerification: {
            autoSignInAfterVerification: true,
            expiresIn: 60 * 60,
            sendOnSignIn: false,
            sendOnSignUp: true,
            sendVerificationEmail: async ({user, url}) => {
                await sendVerificationEmail({
                    email: user.email,
                    name: user.name,
                    verificationUrl: url,
                });
            },
        },
        user: {
            changeEmail: {
                enabled: true,
            },
            deleteUser: {
                enabled: true,
                beforeDelete: async (user) => {
                    const mutationCtx = requireRunMutationCtx(ctx);

                    await mutationCtx.runMutation(internal.userDashboard.completeAccountDeletion, {
                        userId: user.id,
                    });
                },
            },
        },
        socialProviders:
            googleClientId && googleClientSecret
                ? {
                    google: {
                        clientId: googleClientId,
                        clientSecret: googleClientSecret,
                    },
                }
                : undefined,
        plugins: [
            expo(),
            convex({authConfig}),
            ...(process.env.SITE_URL
                ? [crossDomain({siteUrl: process.env.SITE_URL})]
                : []),
        ],
    }) satisfies BetterAuthOptions;

export const createAuth = (ctx: GenericCtx<DataModel>) =>
    betterAuth(createAuthOptions(ctx));

export const getCurrentUser = query({
    args: {},
    handler: async (ctx) => authComponent.getAuthUser(ctx),
});
