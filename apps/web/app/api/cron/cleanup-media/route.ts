import {NextRequest, NextResponse} from "next/server";
import {fetchMutation, fetchQuery} from "convex/nextjs";

import {api} from "@gotujto/convex/_generated/api";
import {deleteVideoObject} from "@/lib/cloud/deleteVideo";
import {getAdminSecret} from "@/lib/auth/getAdminSecret";

const STALE_UPLOAD_AGE_MS = 24 * 60 * 60 * 1000;
const BATCH_SIZE = 50;

export async function GET(request: NextRequest) {
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
        return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }

    try {
        const adminSecret = getAdminSecret();
        const before = Date.now() - STALE_UPLOAD_AGE_MS;
        const [queuedVideos, deletedImages, queuedAvatars, queuedAdminVideos, deletedAdminImages] = await Promise.all([
            fetchMutation(
                api.userDashboard.moveStalePendingVideoUploadsToCleanup,
                {adminSecret, before, limit: BATCH_SIZE},
            ),
            fetchMutation(
                api.userDashboard.cleanupStalePendingImageUploadsForAdmin,
                {adminSecret, before, limit: BATCH_SIZE},
            ),
            fetchMutation(
                api.userDashboard.moveStalePendingAvatarUploadsToCleanup,
                {adminSecret, before, limit: BATCH_SIZE},
            ),
            fetchMutation(
                api.recipes.moveStalePendingAdminVideoUploadsToCleanup,
                {adminSecret, before, limit: BATCH_SIZE},
            ),
            fetchMutation(
                api.recipes.cleanupStalePendingAdminImageUploads,
                {adminSecret, before, limit: BATCH_SIZE},
            ),
        ]);
        const files = await fetchQuery(api.userDashboard.getMediaCleanupBatchForAdmin, {
            adminSecret,
            limit: BATCH_SIZE,
        });
        const results = await Promise.allSettled(
            files.map(async file => {
                await deleteVideoObject(file.videoKey);
                return file._id;
            }),
        );
        const deletedIds = results.flatMap(result =>
            result.status === "fulfilled" ? [result.value] : [],
        );
        const failedIds = results.flatMap((result, index) =>
            result.status === "rejected" ? [files[index]._id] : [],
        );

        if (deletedIds.length > 0 || failedIds.length > 0) {
            await fetchMutation(api.userDashboard.resolveMediaCleanupBatchForAdmin, {
                adminSecret,
                deletedIds,
                failedIds,
            });
        }

        return NextResponse.json({
            queuedVideos,
            deletedImages,
            queuedAvatars,
            queuedAdminVideos,
            deletedAdminImages,
            deleted: deletedIds.length,
            retrying: failedIds.length,
        });
    } catch {
        return NextResponse.json(
            {error: "Nie udalo sie wykonac sprzatania mediow."},
            {status: 500},
        );
    }
}
