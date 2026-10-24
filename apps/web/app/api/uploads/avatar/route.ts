import {randomUUID} from "crypto";
import {NextRequest, NextResponse} from "next/server";
import {PutObjectCommand} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";

import {fetchAuthMutation, isAuthenticated} from "@/lib/auth-server";
import {r2} from "@/lib/cloud/r2";
import {api} from "@gotujto/convex/_generated/api";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

const extensionsByContentType = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
} as const;

type AvatarContentType = keyof typeof extensionsByContentType;

function isAvatarContentType(value: string): value is AvatarContentType {
    return value in extensionsByContentType;
}

function mobileWebCorsHeaders(request: NextRequest) {
    const origin = request.headers.get("origin");
    if (origin !== "http://localhost:8081" && origin !== "http://127.0.0.1:8081") return {};
    return {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Headers": "Content-Type, X-GotujTo-Auth-Cookie",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        Vary: "Origin",
    };
}

function json(request: NextRequest, body: unknown, init?: ResponseInit) {
    return NextResponse.json(body, {...init, headers: {...mobileWebCorsHeaders(request), ...init?.headers}});
}

async function hasMobileSession(request: NextRequest) {
    if (await isAuthenticated()) return true;
    const cookie = request.headers.get("x-gotujto-auth-cookie");
    const convexSiteUrl = process.env.NEXT_PUBLIC_CONVEX_SITE_URL;
    if (!cookie || !convexSiteUrl) return false;
    const response = await fetch(`${convexSiteUrl}/api/auth/get-session`, {
        headers: {Cookie: cookie},
        cache: "no-store",
    });
    if (!response.ok) return false;
    const session: unknown = await response.json();
    return typeof session === "object" && session !== null && "user" in session && Boolean(session.user);
}

export function OPTIONS(request: NextRequest) {
    return new NextResponse(null, {status: 204, headers: mobileWebCorsHeaders(request)});
}

export async function POST(request: NextRequest) {
    const isMobile = new URL(request.url).searchParams.get("purpose") === "mobile";
    try {
        if (!(isMobile ? await hasMobileSession(request) : await isAuthenticated())) {
            return json(request,
                {error: "Zaloguj sie, aby przeslac avatar."},
                {status: 401},
            );
        }

        const body: unknown = await request.json();

        if (
            typeof body !== "object"
            || body === null
            || !("contentType" in body)
            || !("size" in body)
        ) {
            return json(request,
                {error: "Nieprawidlowe dane pliku."},
                {status: 400},
            );
        }

        const {contentType, size} = body as {
            contentType: unknown;
            size: unknown;
        };

        if (
            typeof contentType !== "string"
            || !isAvatarContentType(contentType)
        ) {
            return json(request,
                {error: "Dozwolone formaty: JPG, PNG i WebP."},
                {status: 415},
            );
        }

        if (
            typeof size !== "number"
            || !Number.isSafeInteger(size)
            || size <= 0
            || size > MAX_AVATAR_SIZE
        ) {
            return json(request,
                {error: "Avatar moze miec maksymalnie 5 MB."},
                {status: 413},
            );
        }

        const avatarKey = `avatars/${randomUUID()}.${extensionsByContentType[contentType]}`;
        const command = new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME!,
            Key: avatarKey,
            ContentType: contentType,
            ContentLength: size,
        });
        const uploadUrl = await getSignedUrl(r2, command, {expiresIn: 2 * 60});
        const publicUrl = process.env.R2_PUBLIC_URL;

        if (!publicUrl) {
            throw new Error("Brak publicznego adresu plikow.");
        }

        if (!isMobile) {
            await fetchAuthMutation(api.userDashboard.registerPendingAvatarUpload, {avatarKey});
        }

        return json(request, {
            uploadUrl,
            avatarUrl: `${publicUrl.replace(/\/$/, "")}/${avatarKey}`,
            avatarKey,
        });
    } catch {
        return json(request,
            {error: "Nie udalo sie przygotowac uploadu avatara."},
            {status: 500},
        );
    }
}
