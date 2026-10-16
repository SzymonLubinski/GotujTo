type AvatarUploadResponse = {
    uploadUrl: string;
    avatarUrl: string;
    avatarKey: string;
};

export async function uploadAvatar(file: File): Promise<AvatarUploadResponse> {
    const response = await fetch("/api/uploads/avatar", {
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
        throw new Error("Nie udalo sie przygotowac uploadu avatara.");
    }

    const {uploadUrl, avatarUrl, avatarKey} = await response.json() as AvatarUploadResponse;

    if (
        typeof uploadUrl !== "string"
        || typeof avatarUrl !== "string"
        || typeof avatarKey !== "string"
    ) {
        throw new Error("Serwer zwrocil nieprawidlowe dane avatara.");
    }

    const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
            "Content-Type": file.type,
        },
        body: file,
    });

    if (!uploadResponse.ok) {
        throw new Error("Nie udalo sie przeslac avatara.");
    }

    return {avatarUrl, avatarKey, uploadUrl};
}
