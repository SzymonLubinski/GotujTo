import "server-only";

export function getAdminSecret(): string {
    const adminSecret =
        process.env.ADMIN_CONVEX_SECRET;

    if (!adminSecret) {
        throw new Error(
            "Brakuje zmiennej ADMIN_CONVEX_SECRET.",
        );
    }

    return adminSecret;
}