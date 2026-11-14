import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    cacheComponents: true,
    devIndicators: false,
    images: {
        // The short feed is capped at 448 px wide. Supplying a 480 px variant
        // prevents Next from selecting the default 640 px source for a 448 px
        // image on standard-density mobile screens.
        deviceSizes: [360, 414, 480, 640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        remotePatterns: [
            {
                hostname: "images.unsplash.com",
                protocol: "https",
                port: "",
            },
            {
                hostname: "modest-finch-481.eu-west-1.convex.cloud",
                protocol: "https",
                port: "",
            },
            {
                hostname: "lovable-bloodhound-237.convex.cloud",
                protocol: "https",
                port: "",
            },
            {
                hostname: "youthful-lobster-102.eu-west-1.convex.cloud",
                protocol: "https",
                port: "",
            },
            {
                hostname: "youthful-lobster-102.eu-west-1.convex.cloud",
                protocol: "https",
                port: "",
            },
        ],
    },
};

export default nextConfig;
