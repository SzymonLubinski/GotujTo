import { fetchMutation } from "convex/nextjs";
import { api } from "@gotujto/convex/_generated/api";
import { RecipeImageValue } from "@/lib/schemas/recipe";
import { Id } from "@gotujto/convex/_generated/dataModel";


export async function uploadImages(
    images: RecipeImageValue[],
): Promise<Id<"_storage">[]> {
    const storageIds: Id<"_storage">[] = [];

    for (const image of images) {
        const uploadUrl = await fetchMutation(
            api.recipes.generateImageUploadUrl,
            {},
        );

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

        storageIds.push(storageId);
    }

    return storageIds;
}