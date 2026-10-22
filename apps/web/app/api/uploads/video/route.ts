import {NextRequest, NextResponse} from "next/server";
import {randomUUID} from "crypto";
import {PutObjectCommand} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import {r2} from "@/lib/cloud/r2";
import {requireAdminRequest} from "@/lib/auth/requireAdminRequest";
import {isAuthenticated} from "@/lib/auth-server";
import {api} from "@gotujto/convex/_generated/api";
import {fetchMutation} from "convex/nextjs";
import {getAdminSecret} from "@/lib/auth/getAdminSecret";

const MAX_VIDEO_SIZE = 200 * 1024 * 1024;

const allowedMimeTypes = new Set([
    "video/mp4",
    "video/webm",
]);

function mobileWebCorsHeaders(request: NextRequest) {
    const origin = request.headers.get("origin");

    if (origin !== "http://localhost:8081" && origin !== "http://127.0.0.1:8081") {
        return {};
    }

    return {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Headers": "Content-Type, X-GotujTo-Auth-Cookie",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        Vary: "Origin",
    };
}

async function hasMobileSubmissionSession(request: NextRequest) {
    if (await isAuthenticated()) {
        return true;
    }

    const cookie = request.headers.get("x-gotujto-auth-cookie");
    const convexSiteUrl = process.env.NEXT_PUBLIC_CONVEX_SITE_URL;

    if (!cookie || !convexSiteUrl) {
        return false;
    }

    const response = await fetch(`${convexSiteUrl}/api/auth/get-session`, {
        headers: {Cookie: cookie},
        cache: "no-store",
    });

    if (!response.ok) {
        return false;
    }

    const session: unknown = await response.json();
    return typeof session === "object" && session !== null && "user" in session && Boolean(session.user);
}

function json(request: NextRequest, body: unknown, init?: ResponseInit) {
    return NextResponse.json(body, {
        ...init,
        headers: {...mobileWebCorsHeaders(request), ...init?.headers},
    });
}

export function OPTIONS(request: NextRequest) {
    return new NextResponse(null, {status: 204, headers: mobileWebCorsHeaders(request)});
}

export async function POST(request: NextRequest) {
    const purpose = new URL(request.url).searchParams.get("purpose");
    const isUserSubmission = purpose === "blog-submission" || purpose === "recipe-submission";

    try {
        if (isUserSubmission) {
            if (!(await hasMobileSubmissionSession(request))) {
                return json(request,
                    {error: "Zaloguj sie, aby przeslac film."},
                    {status: 401},
                );
            }
        } else {
            await requireAdminRequest();
        }

        const body: unknown = await request.json();

        if (
            typeof body !== "object" ||
            body === null ||
            !("contentType" in body) ||
            !("size" in body)
        ) {
            return json(request,
                {error: "Nieprawidłowe dane pliku."},
                {status: 400},
            );
        }

        const {contentType, size} = body as {
            contentType: unknown;
            size: unknown;
        };

        if (
            typeof contentType !== "string" ||
            !allowedMimeTypes.has(contentType)
        ) {
            return json(request,
                {error: "Dozwolone formaty: MP4 i WebM."},
                {status: 415},
            );
        }

        if (
            typeof size !== "number" ||
            !Number.isSafeInteger(size) ||
            size <= 0 ||
            size > MAX_VIDEO_SIZE
        ) {
            return json(request,
                {error: "Film może mieć maksymalnie 200 MB."},
                {status: 413},
            );
        }

        const extension =
            contentType === "video/webm"
                ? "webm"
                : "mp4";

        const directory = purpose === "blog-submission"
            ? "blog-submissions"
            : purpose === "recipe-submission"
                ? "recipe-submissions"
                : "recipes";
        const videoKey = `${directory}/${randomUUID()}.${extension}`;

        if (
            typeof body !== "object" ||
            body === null ||
            !("contentType" in body) ||
            !("size" in body)
        ) {
            return json(request,
                {error: "Nieprawidłowe dane pliku."},
                {status: 400},
            );
        }

        if (!isUserSubmission) {
            await fetchMutation(api.recipes.registerPendingAdminVideoUpload, {
                adminSecret: getAdminSecret(),
                videoKey,
            });
        }

        const command = new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME!,
            Key: videoKey,
            ContentType: contentType,
            ContentLength: size,
        });

        const uploadUrl = await getSignedUrl(
            r2,
            command,
            {expiresIn: 2 * 60},
        );

        return json(request, {
            videoKey,
            uploadUrl,
        });
    } catch {
        return json(request,
            {error: "Brak uprawnień."},
            {status: 401},
        );
    }
}
