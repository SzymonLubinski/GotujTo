import { RecipeImageValue } from "@/lib/schemas/recipe";
import { Id } from "@gotujto/convex/_generated/dataModel";
import {generateImageUploadUrlAction} from "@/app/actions";

type UploadUrlGenerator = (input: {
    contentType: string;
    size: number;
}) => Promise<string>;

type PendingImageUploadRegistrar = (storageId: Id<"_storage">) => Promise<unknown>;

export async function uploadImages(
    images: RecipeImageValue[],
    generateUploadUrl: UploadUrlGenerator = generateImageUploadUrlAction,
    registerPendingUpload?: PendingImageUploadRegistrar,
): Promise<Id<"_storage">[]> {
    const storageIds: Id<"_storage">[] = [];

    for (const image of images) {
        const uploadUrl = await generateUploadUrl({
            contentType: image.file.type,
            size: image.file.size,
        });

        const uploadResponse = await fetch(uploadUrl, {
            method: "POST",
            headers: {
                "Content-Type": image.file.type,
            },
            body: image.file,
        });

        if (!uploadResponse.ok) {
            throw new Error("Nie udało się przesłać zdjęcia.");
        }

        const { storageId } = await uploadResponse.json() as {
            storageId: Id<"_storage">;
        };

        if (registerPendingUpload) {
            await registerPendingUpload(storageId);
        }

        storageIds.push(storageId);
    }

    return storageIds;
}
