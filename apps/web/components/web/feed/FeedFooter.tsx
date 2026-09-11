"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Layers , Home, Refrigerator } from "lucide-react"
import { cn } from "@/lib/utils"

const navigationItems = [
    {
        label: "Home",
        href: "/",
        icon: Home,
        active: (pathname: string) => pathname === "/",
    },
    {
        label: "Lodówka",
        href: "/fridge",
        icon: Refrigerator,
        active: (pathname: string) => pathname.startsWith("/fridge"),
    },
    {
        label: "Więcej",
        href: "/more",
        icon: Layers,
        active: (pathname: string) => pathname.startsWith("/more"),
    },
]

export default function FeedFooter() {
    const pathname = usePathname()

    return (
        <footer className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center">
            <nav className="pointer-events-auto grid w-full max-w-md grid-cols-3 border-t border-white/10 bg-black/80 px-2 pb-[env(safe-area-inset-bottom)] text-white backdrop-blur-xl">
                {navigationItems.map((item) => {
                    const Icon = item.icon
                    const isActive = item.active(pathname)

                    return (
                        <Link key={item.href} href={item.href} className={cn("flex min-h-16 flex-col items-center justify-center gap-1 text-xs transition-colors", isActive ? "text-lime-400" : "text-white/60 hover:text-white")}>
                            <Icon className="size-5" />
                            <span>{item.label}</span>
                        </Link>
                    )
                })}
            </nav>
        </footer>
    )
}