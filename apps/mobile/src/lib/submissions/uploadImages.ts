import {type Id} from "@gotujto/convex/_generated/dataModel";
import {File} from "expo-file-system";
import {fetch as expoFetch} from "expo/fetch";
import {Platform} from "react-native";

export type SubmissionImageAsset = {
    uri: string;
    mimeType: string | null;
    fileName: string | null;
    fileSize: number | null;
};

type GenerateUploadUrl = (args: {contentType: string; size: number}) => Promise<string>;
type RegisterUpload = (args: {storageId: Id<"_storage">}) => Promise<unknown>;

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

function getContentType(image: SubmissionImageAsset) {
    const normalizedType = image.mimeType?.toLowerCase();

    if (normalizedType === "image/jpg") return "image/jpeg";
    if (normalizedType && allowedImageTypes.has(normalizedType)) return normalizedType;

    const extension = image.fileName?.split(".").pop()?.toLowerCase();
    if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
    if (extension === "png") return "image/png";
    if (extension === "webp") return "image/webp";

    return normalizedType ?? "";
}

export async function uploadSubmissionImages(
    images: SubmissionImageAsset[],
    generateUploadUrl: GenerateUploadUrl,
    registerUpload: RegisterUpload,
) {
    const storageIds: Id<"_storage">[] = [];

    for (const image of images) {
        const contentType = getContentType(image);

        if (!allowedImageTypes.has(contentType)) {
            throw new Error("Dozwolone formaty zdjęć: JPG, PNG i WebP.");
        }

        let body: Blob | File;
        let size = image.fileSize ?? 0;

        if (Platform.OS === "web") {
            let fileResponse: Response;
            try {
                fileResponse = await fetch(image.uri);
            } catch {
                throw new Error("Nie mozna odczytac wybranego zdjecia. Wybierz je ponownie.");
            }

            if (!fileResponse.ok) {
                throw new Error("Nie mozna odczytac wybranego zdjecia. Wybierz je ponownie.");
            }

            body = await fileResponse.blob();
            size ||= body.size;
        } else {
            body = new File(image.uri);
            size ||= body.size;
        }

        if (!Number.isFinite(size) || size <= 0 || size > MAX_IMAGE_SIZE) {
            throw new Error("Zdjęcie może mieć maksymalnie 10 MB.");
        }

        const uploadUrl = await generateUploadUrl({contentType, size});
        let uploadResponse: Response;
        try {
            uploadResponse = await (Platform.OS === "web" ? fetch : expoFetch)(uploadUrl, {
                method: "POST",
                headers: {"Content-Type": contentType},
                body,
            });
        } catch {
            throw new Error("Nie udalo sie polaczyc z magazynem zdjec. Sprawdz polaczenie i sprobuj ponownie.");
        }

        if (!uploadResponse.ok) {
            throw new Error(`Magazyn zdjec odrzucil przeslanie (kod ${uploadResponse.status}).`);
        }

        if (!uploadResponse.ok) {
            throw new Error("Nie udało się przesłać zdjęcia.");
        }

        const {storageId} = await uploadResponse.json() as {storageId: Id<"_storage">};
        await registerUpload({storageId});
        storageIds.push(storageId);
    }

    return storageIds;
}
