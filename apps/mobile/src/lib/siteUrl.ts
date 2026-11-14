export function getPublicSiteUrl() {
    const siteUrl = process.env.EXPO_PUBLIC_SITE_URL?.replace(/\/$/, "");

    if (!siteUrl) {
        return undefined;
    }

    return siteUrl.replace(/^https:\/\/www\.gotujto\.com$/i, "https://gotujto.com");
}
