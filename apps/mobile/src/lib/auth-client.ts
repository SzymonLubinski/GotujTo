import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import {createAuthClient} from "better-auth/react";
import {expoClient} from "@better-auth/expo/client";
import {convexClient, crossDomainClient} from "@convex-dev/better-auth/client/plugins";
import {Platform} from "react-native";

const scheme = typeof Constants.expoConfig?.scheme === "string"
    ? Constants.expoConfig.scheme
    : "mobile";
const convexSiteUrl = process.env.EXPO_PUBLIC_CONVEX_SITE_URL
    ?? process.env.EXPO_PUBLIC_CONVEX_URL?.replace(/\.convex\.cloud$/, ".convex.site");

if (!convexSiteUrl) {
    throw new Error("Brakuje EXPO_PUBLIC_CONVEX_SITE_URL albo EXPO_PUBLIC_CONVEX_URL.");
}

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
                    storage: SecureStore,
                }),
            ]),
    ],
});
