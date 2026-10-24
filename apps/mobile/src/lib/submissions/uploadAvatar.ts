import {File} from "expo-file-system";
import {fetch as expoFetch} from "expo/fetch";
import {Platform} from "react-native";
import {authClient} from "@/lib/auth-client";
import {type SubmissionImageAsset} from "@/lib/submissions/uploadImages";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function uploadAvatar(image: SubmissionImageAsset, registerUpload: (args: {avatarKey: string}) => Promise<unknown>) {
    let contentType = image.mimeType?.toLowerCase() ?? "";
    if (contentType === "image/jpg") contentType = "image/jpeg";
    if (!allowedTypes.has(contentType)) {
        const extension = image.fileName?.split(".").pop()?.toLowerCase();
        if (extension === "jpg" || extension === "jpeg") contentType = "image/jpeg";
        else if (extension === "png") contentType = "image/png";
        else if (extension === "webp") contentType = "image/webp";
    }
    if (!allowedTypes.has(contentType)) throw new Error("Wybierz zdjęcie JPG, PNG lub WebP.");

    const isWeb = Platform.OS === "web";
    let body: Blob | File;
    let size: number;
    if (isWeb) {
        const response = await fetch(image.uri);
        if (!response.ok) throw new Error("Nie można odczytać zdjęcia. Wybierz je ponownie.");
        body = await response.blob();
        size = body.size;
    } else {
        body = new File(image.uri);
        size = body.size;
    }
    if (!Number.isSafeInteger(size) || size <= 0 || size > 5 * 1024 * 1024) {
        throw new Error("Zdjęcie musi mieć maksymalnie 5 MB.");
    }
    const siteUrl = process.env.EXPO_PUBLIC_SITE_URL?.replace(/\/$/, "");
    if (!siteUrl) throw new Error("Brakuje adresu strony do przesłania zdjęcia.");
    const cookie = await authClient.getCookie();
    const request = isWeb ? fetch : expoFetch;
    const response = await request(`${siteUrl}/api/uploads/avatar?purpose=mobile`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(isWeb || !cookie ? {} : {Cookie: cookie}),
            ...(isWeb && cookie ? {"X-GotujTo-Auth-Cookie": cookie} : {}),
        },
        credentials: isWeb ? "include" : "omit",
        body: JSON.stringify({contentType, size}),
    });
    if (!response.ok) throw new Error(response.status === 401 ? "Sesja wygasła. Zaloguj się ponownie." : "Nie udało się przygotować przesyłania zdjęcia.");
    const {uploadUrl, avatarUrl, avatarKey} = await response.json() as {uploadUrl: string; avatarUrl: string; avatarKey: string};
    await registerUpload({avatarKey});
    const uploaded = await request(uploadUrl, {method: "PUT", headers: {"Content-Type": contentType}, body});
    if (!uploaded.ok) throw new Error("Nie udało się przesłać zdjęcia do magazynu.");
    return avatarUrl;
}
