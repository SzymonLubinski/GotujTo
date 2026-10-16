import {NextRequest, NextResponse} from "next/server";
import {randomUUID} from "crypto";
import {PutObjectCommand} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import {r2} from "@/lib/cloud/r2";
import {requireAdminRequest} from "@/lib/auth/requireAdminRequest";
import {fetchAuthMutation, isAuthenticated} from "@/lib/auth-server";
import {api} from "@gotujto/convex/_generated/api";
import {fetchMutation} from "convex/nextjs";
import {getAdminSecret} from "@/lib/auth/getAdminSecret";

const MAX_VIDEO_SIZE = 200 * 1024 * 1024;

const allowedMimeTypes = new Set([
    "video/mp4",
    "video/webm",
]);

export async function POST(request: NextRequest) {
    const purpose = new URL(request.url).searchParams.get("purpose");
    const isUserSubmission = purpose === "blog-submission" || purpose === "recipe-submission";

    try {
        if (isUserSubmission) {
            if (!(await isAuthenticated())) {
                return NextResponse.json(
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
            return NextResponse.json(
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
            return NextResponse.json(
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
            return NextResponse.json(
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
            return NextResponse.json(
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

        if (isUserSubmission) {
            await fetchAuthMutation(
                api.userDashboard.registerPendingSubmissionVideo,
                {
                    videoKey,
                    purpose: purpose === "recipe-submission" ? "recipe" : "blog",
                },
            );
        }

        return NextResponse.json({
            videoKey,
            uploadUrl,
        });
    } catch {
        return NextResponse.json(
            {error: "Brak uprawnień."},
            {status: 401},
        );
    }
}
