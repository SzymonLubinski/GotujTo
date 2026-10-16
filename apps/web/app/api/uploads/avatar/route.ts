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

export async function POST(request: NextRequest) {
    if (!(await isAuthenticated())) {
        return NextResponse.json(
            {error: "Zaloguj sie, aby przeslac avatar."},
            {status: 401},
        );
    }

    try {
        const body: unknown = await request.json();

        if (
            typeof body !== "object"
            || body === null
            || !("contentType" in body)
            || !("size" in body)
        ) {
            return NextResponse.json(
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
            return NextResponse.json(
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
            return NextResponse.json(
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

        await fetchAuthMutation(api.userDashboard.registerPendingAvatarUpload, {
            avatarKey,
        });

        return NextResponse.json({
            uploadUrl,
            avatarUrl: `${publicUrl.replace(/\/$/, "")}/${avatarKey}`,
            avatarKey,
        });
    } catch {
        return NextResponse.json(
            {error: "Nie udalo sie przygotowac uploadu avatara."},
            {status: 500},
        );
    }
}
