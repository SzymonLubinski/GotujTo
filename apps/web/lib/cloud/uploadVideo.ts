

type UploadVideoResponse = {
    uploadUrl: string;
    videoKey: string;
};


export async function uploadVideo(file: File): Promise<string> {
    const response = await fetch("/api/uploads/video", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            contentType: file.type,
            size: file.size,
        }),
    });

    if (!response.ok) {
        throw new Error("Nie udało się przygotować uploadu filmu.");
    }

    const { uploadUrl, videoKey } = (await response.json() as UploadVideoResponse);

    const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
            "Content-Type": file.type,
        },
        body: file,
    });

    if (!uploadResponse.ok) {
        throw new Error("Nie udało się wysłać filmu.");
    }

    return videoKey;
}