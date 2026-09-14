import "server-only";

import {timingSafeEqual} from "node:crypto";
import {headers} from "next/headers";

function valuesMatch(
    received: string,
    expected: string,
) {
    const receivedBuffer =
        Buffer.from(received);

    const expectedBuffer =
        Buffer.from(expected);

    return (
        receivedBuffer.length === expectedBuffer.length &&
        timingSafeEqual(
            receivedBuffer,
            expectedBuffer,
        )
    );
}

export async function requireAdminRequest() {
    const authorization =
        (await headers()).get("authorization");

    if (!authorization?.startsWith("Basic ")) {
        throw new Error("UNAUTHORIZED");
    }

    const encodedCredentials =
        authorization.slice("Basic ".length);

    let decodedCredentials: string;

    try {
        decodedCredentials = Buffer
            .from(encodedCredentials, "base64")
            .toString("utf8");
    } catch {
        throw new Error("UNAUTHORIZED");
    }

    const separatorIndex =
        decodedCredentials.indexOf(":");

    if (separatorIndex === -1) {
        throw new Error("UNAUTHORIZED");
    }

    const username =
        decodedCredentials.slice(0, separatorIndex);

    const password =
        decodedCredentials.slice(separatorIndex + 1);

    const expectedUsername =
        process.env.ADMIN_USERNAME;

    const expectedPassword =
        process.env.ADMIN_PASSWORD;

    if (
        !expectedUsername ||
        !expectedPassword ||
        !valuesMatch(username, expectedUsername) ||
        !valuesMatch(password, expectedPassword)
    ) {
        throw new Error("UNAUTHORIZED");
    }
}