import {ConvexError} from "convex/values";

export function requireAdmin(adminSecret: string) {
    const expectedSecret =
        process.env.ADMIN_CONVEX_SECRET;

    if (
        !expectedSecret ||
        adminSecret !== expectedSecret
    ) {
        throw new ConvexError({
            code: "UNAUTHORIZED",
            message: "Brak uprawnień administratora.",
        });
    }
}