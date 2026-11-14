import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import {createAuthClient} from "better-auth/react";
import {expoClient} from "@better-auth/expo/client";
import {convexClient, crossDomainClient} from "@convex-dev/better-auth/client/plugins";
import {Platform} from "react-native";
import {recordAuthDiagnostic} from "@/lib/authDiagnostics";

const scheme = typeof Constants.expoConfig?.scheme === "string"
    ? Constants.expoConfig.scheme
    : "mobile";
const convexSiteUrl = process.env.EXPO_PUBLIC_CONVEX_SITE_URL
    ?? process.env.EXPO_PUBLIC_CONVEX_URL?.replace(/\.convex\.cloud$/, ".convex.site");

if (!convexSiteUrl) {
    throw new Error("Brakuje EXPO_PUBLIC_CONVEX_SITE_URL albo EXPO_PUBLIC_CONVEX_URL.");
}

function storageArea(key: string) {
    if (key.includes("cookie")) return "cookie";
    if (key.includes("session")) return "session-cache";

    return "other";
}

function recordSecureStoreOperation(
    operation: string,
    key: string,
    details: Record<string, boolean> = {},
) {
    void recordAuthDiagnostic(`SecureStore ${operation}`, {
        area: storageArea(key),
        ...details,
    });
}

// Adapter diagnostyczny zachowuje dokładnie ten sam kontrakt co SecureStore.
// Rejestruje wyłącznie typ operacji i powodzenie — nigdy klucz ani wartość.
const diagnosticSecureStore: Pick<
    typeof SecureStore,
    "getItem" | "getItemAsync" | "setItem" | "setItemAsync"
> = {
    getItem(...args) {
        const [key] = args;

        try {
            const value = SecureStore.getItem(...args);

            recordSecureStoreOperation("get", key, {success: true, hasValue: Boolean(value)});
            return value;
        } catch (error) {
            recordSecureStoreOperation("get", key, {success: false});
            throw error;
        }
    },
    async getItemAsync(...args) {
        const [key] = args;

        try {
            const value = await SecureStore.getItemAsync(...args);

            recordSecureStoreOperation("getAsync", key, {success: true, hasValue: Boolean(value)});
            return value;
        } catch (error) {
            recordSecureStoreOperation("getAsync", key, {success: false});
            throw error;
        }
    },
    setItem(...args) {
        const [key] = args;

        try {
            SecureStore.setItem(...args);
            recordSecureStoreOperation("set", key, {success: true});
        } catch (error) {
            recordSecureStoreOperation("set", key, {success: false});
            throw error;
        }
    },
    async setItemAsync(...args) {
        const [key] = args;

        try {
            await SecureStore.setItemAsync(...args);
            recordSecureStoreOperation("setAsync", key, {success: true});
        } catch (error) {
            recordSecureStoreOperation("setAsync", key, {success: false});
            throw error;
        }
    },
};

export const authClient = createAuthClient({
    baseURL: convexSiteUrl,
    plugins: [
        convexClient(),
        ...(Platform.OS === "web"
            ? [crossDomainClient()]
            : [
                expoClient({
                    scheme,
                    storagePrefix: scheme,
                    storage: diagnosticSecureStore,
                }),
            ]),
    ],
});
