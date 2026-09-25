import type {Metadata} from "next";
import {Geist, Geist_Mono} from "next/font/google";
import "./globals.css";
import {ConvexClientProvider} from "@/components/providers/convex-provider";
import {Toaster} from "@/components/ui/sonner";
import {ThemeProvider} from "@/components/ui/theme-provider";
import React from "react";


const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

const siteUrl = "https://gotuj-to.vercel.app"

export const metadata: Metadata = {
    metadataBase: new URL(siteUrl),

    title: {
        default: "GotujTo – przepisy z produktów i promocji",
        template: "%s | GotujTo",
    },

    description:
        "Znajdź przepisy dopasowane do produktów w lodówce oraz aktualnych promocji.",

    applicationName: "GotujTo",

    alternates: {
        canonical: "/",
    },

    openGraph: {
        type: "website",
        locale: "pl_PL",
        siteName: "GotujTo",
        title: "GotujTo – przepisy z produktów i promocji",
        description:
            "Znajdź przepisy dopasowane do produktów w lodówce oraz aktualnych promocji.",
        url: "/",
    },

    twitter: {
        card: "summary_large_image",
        title: "GotujTo",
        description:
            "Przepisy dopasowane do produktów i promocji.",
    },

    robots: {
        index: true,
        follow: true,
    },
};

export default function RootLayout({children}:Readonly<{children: React.ReactNode}>) {

    return (
        <html lang="pl" suppressHydrationWarning>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider attribute="class"
                       defaultTheme="system"
                       enableSystem
                       disableTransitionOnChange
        >
            <ConvexClientProvider>{children}</ConvexClientProvider>
            <Toaster closeButton/>
        </ThemeProvider>
        </body>
        </html>
    );
}
