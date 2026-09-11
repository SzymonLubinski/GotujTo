import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {r2} from "@/lib/cloud/r2";

const MAX_VIDEO_SIZE = 200 * 1024 * 1024;

const allowedMimeTypes = new Set([
    "video/mp4",
    "video/webm",
]);

export async function POST(request: NextRequest) {
    const { contentType, size } = await request.json();

    if (!allowedMimeTypes.has(contentType)) {
        return NextResponse.json(
            { error: "Nieobsługiwany format filmu." },
            { status: 400 },
        );
    }

    if (size > MAX_VIDEO_SIZE) {
        return NextResponse.json(
            { error: "Film jest za duży." },
            { status: 400 },
        );
    }

    const extension = contentType === "video/webm" ? "webm" : "mp4";

    const videoKey = `recipes/${randomUUID()}.${extension}`;

    const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: videoKey,
        ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(r2, command, {
        expiresIn: 60 * 5,
    });

    return NextResponse.json({
        videoKey,
        uploadUrl,
    });
}