import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

const ANONYMOUS_ID_KEY = "@gotujto/anonymous-id";

let anonymousIdPromise: Promise<string> | null = null;

async function loadAnonymousId() {
    const storedAnonymousId = await AsyncStorage.getItem(
        ANONYMOUS_ID_KEY,
    );

    if (storedAnonymousId) {
        return storedAnonymousId;
    }

    const newAnonymousId = Crypto.randomUUID();

    await AsyncStorage.setItem(
        ANONYMOUS_ID_KEY,
        newAnonymousId,
    );

    return newAnonymousId;
}

export function getOrCreateAnonymousId() {
    if (!anonymousIdPromise) {
        anonymousIdPromise = loadAnonymousId().catch(error => {
            anonymousIdPromise = null;
            throw error;
        });
    }

    return anonymousIdPromise;
}