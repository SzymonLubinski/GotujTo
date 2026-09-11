const ANONYMOUS_ID_KEY = "gotujto:anonymous-id";

export function getOrCreateAnonymousId() {
    if (typeof window === "undefined") {
        return null;
    }

    const storedAnonymousId = window.localStorage.getItem(
        ANONYMOUS_ID_KEY,
    );

    if (storedAnonymousId) {
        return storedAnonymousId;
    }

    const newAnonymousId = window.crypto.randomUUID();

    window.localStorage.setItem(
        ANONYMOUS_ID_KEY,
        newAnonymousId,
    );

    return newAnonymousId;
}