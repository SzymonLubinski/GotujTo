import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    cacheComponents: true,
    devIndicators: false,
    images: {
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