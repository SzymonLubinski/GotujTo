function getErrorMessage(error: unknown): string {
    if (typeof error === "string") {
        return error;
    }

    if (typeof error === "object" && error !== null && "message" in error && typeof error.message === "string") {
        return error.message;
    }

    return "";
}

/** Converts backend errors into messages that are safe and useful for an app user. */
export function getUserFacingErrorMessage(error: unknown, fallback: string): string {
    const message = getErrorMessage(error);

    if (message.includes("INAPPROPRIATE_COMMENT") || message.includes("niedozwolone wulgaryzmy")) {
        return "Nie można dodać komentarza, ponieważ zawiera wulgaryzmy.";
    }

    if (message.includes("COMMENT_RATE_LIMIT")) {
        return "Możesz dodać maksymalnie 10 komentarzy w ciągu 30 minut. Spróbuj ponownie później.";
    }

    if (message.includes("MAX_PENDING_RECIPE_SUBMISSIONS")) {
        return "Masz już maksymalną liczbę przepisów oczekujących na weryfikację. Poczekaj na decyzję administratora.";
    }

    if (message.includes("CANNOT_REPORT_OWN_COMMENT")) {
        return "Nie możesz zgłosić własnego komentarza.";
    }

    if (message.includes("UNAUTHENTICATED") || message.includes("Zaloguj sie")) {
        return "Zaloguj się, aby wykonać tę czynność.";
    }

    return fallback;
}
