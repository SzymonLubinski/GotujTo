import {authClient} from "@/lib/auth-client";
import {File} from "expo-file-system";
import {fetch as expoFetch} from "expo/fetch";
import {Platform} from "react-native";

type SubmissionVideoAsset = {
    uri: string;
    mimeType: string | null;
    fileName: string | null;
    fileSize: number | null;
};

type SubmissionPurpose = "recipe-submission" | "blog-submission";
type RegisterVideoUpload = (args: {videoKey: string; purpose: "recipe" | "blog"}) => Promise<unknown>;

const MAX_VIDEO_SIZE = 200 * 1024 * 1024;
const allowedVideoTypes = new Set(["video/mp4", "video/webm"]);

export async function uploadSubmissionVideo(
    asset: SubmissionVideoAsset,
    purpose: SubmissionPurpose,
    registerVideoUpload: RegisterVideoUpload,
) {
    const contentType = asset.mimeType ?? "";

    if (!allowedVideoTypes.has(contentType)) {
        throw new Error("Dozwolone formaty filmu: MP4 i WebM.");
    }

    const isWeb = Platform.OS === "web";
    let body: Blob | File;
    let size = asset.fileSize ?? 0;

    if (isWeb) {
        let fileResponse: Response;

        try {
            fileResponse = await fetch(asset.uri);
        } catch {
            throw new Error("Nie mozna odczytac wybranego filmu. Wybierz go ponownie.");
        }

        if (!fileResponse.ok) {
            throw new Error("Nie mozna odczytac wybranego filmu. Wybierz go ponownie.");
        }

        body = await fileResponse.blob();
        size ||= body.size;
    } else {
        body = new File(asset.uri);
        size ||= body.size;
    }

    if (!Number.isFinite(size) || size <= 0 || size > MAX_VIDEO_SIZE) {
        throw new Error("Film może mieć maksymalnie 200 MB.");
    }

    const siteUrl = process.env.EXPO_PUBLIC_SITE_URL?.replace(/\/$/, "");

    if (!siteUrl) {
        throw new Error("Brakuje EXPO_PUBLIC_SITE_URL do przesyłania filmów.");
    }

    // getCookie() is asynchronous. Passing its unresolved Promise made the
    // upload endpoint receive an invalid Cookie header.
    const cookie = await authClient.getCookie();
    let response: Response;
    try {
        response = await (isWeb ? fetch : expoFetch)(`${siteUrl}/api/uploads/video?purpose=${purpose}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(isWeb || !cookie ? {} : {Cookie: cookie}),
                ...(isWeb && cookie ? {"X-GotujTo-Auth-Cookie": cookie} : {}),
            },
            credentials: isWeb ? "include" : "omit",
            body: JSON.stringify({contentType, size}),
        });
    } catch {
        throw new Error(
            isWeb
                ? "Przegladarka nie polaczyla sie z serwerem przesylania filmu. Sprawdz CORS aplikacji Web."
                : "Telefon nie polaczyl sie z serwerem przesylania filmu. Sprawdz publiczny adres strony w konfiguracji aplikacji.",
        );
    }

    if (!response.ok) {
        throw new Error("Nie udało się przygotować przesyłania filmu.");
    }

    const {uploadUrl, videoKey} = await response.json() as {uploadUrl: string; videoKey: string};
    let uploadResponse: Response;
    try {
        uploadResponse = await (isWeb ? fetch : expoFetch)(uploadUrl, {
            method: "PUT",
            headers: {"Content-Type": contentType},
            body,
        });
    } catch {
        throw new Error(
            isWeb
                ? "Przegladarka zablokowala wysylke filmu do R2. Sprawdz CORS bucketa."
                : "Telefon nie polaczyl sie z magazynem filmow. Sprobuj ponownie.",
        );
    }

    if (!uploadResponse.ok) {
        throw new Error("Nie udało się przesłać filmu.");
    }

    await registerVideoUpload({
        videoKey,
        purpose: purpose === "recipe-submission" ? "recipe" : "blog",
    });

    return videoKey;
}

export type {SubmissionVideoAsset};
