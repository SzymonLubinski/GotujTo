import {NextRequest, NextResponse} from "next/server";
import {randomUUID} from "crypto";
import {PutObjectCommand} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import {r2} from "@/lib/cloud/r2";
import {requireAdminRequest} from "@/lib/auth/requireAdminRequest";

const MAX_VIDEO_SIZE = 200 * 1024 * 1024;

const allowedMimeTypes = new Set([
    "video/mp4",
    "video/webm",
]);

export async function POST(request: NextRequest) {
    try {
        await requireAdminRequest();

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

        const videoKey =
            `recipes/${randomUUID()}.${extension}`;

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