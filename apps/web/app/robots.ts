import type { MetadataRoute } from "next";

const siteUrl = "https://gotujto.com";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: "*",
            allow: [
                "/",
                "/api/auth/get-session",
            ],
            disallow: [
                "/admin/",
                "/api/",
            ],
        },
        sitemap: `${siteUrl}/sitemap.xml`,
        host: siteUrl,
    };
}