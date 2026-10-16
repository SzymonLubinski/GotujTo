import {DeleteObjectCommand} from "@aws-sdk/client-s3";

import {r2} from "@/lib/cloud/r2";

export async function deleteVideoObject(videoKey: string) {
    const bucketName = process.env.R2_BUCKET_NAME;

    if (!bucketName) {
        throw new Error("Brakuje konfiguracji magazynu filmow.");
    }

    await r2.send(new DeleteObjectCommand({
        Bucket: bucketName,
        Key: videoKey,
    }));
}
