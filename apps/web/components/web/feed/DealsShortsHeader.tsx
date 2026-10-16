"use client"

import Link from "next/link"
import { LogIn, Search, Store, UserRound } from "lucide-react"
import {authClient} from "@/lib/auth-client"

type DealsNavProps = {
    onStoresClick: () => void
}

export default function DealsShortsHeader({ onStoresClick }: DealsNavProps) {
    const {data: session} = authClient.useSession()
    const isSignedIn = Boolean(session)
    const accountLabel = isSignedIn ? "Profil" : "Zaloguj się"

    return (
        <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center">
            <nav className="pointer-events-auto flex h-20 w-full max-w-md items-center justify-between bg-linear-to-b from-black/85 via-black/45 to-transparent px-4 pb-2 pt-[env(safe-area-inset-top)] text-white">
                <Link href="/" className="shrink-0 text-2xl font-black tracking-tight">
                    Gotuj<span className="text-lime-400">To</span>
                </Link>

                <div className="flex items-center gap-2">
                    <Link href="/search" aria-label="Wyszukaj przepisy" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-black/35 backdrop-blur-md transition-colors hover:bg-black/60">
                        <Search className="size-5" />
                    </Link>

                    <button type="button" onClick={onStoresClick} className="flex h-10 items-center gap-2 rounded-full bg-black/35 px-4 text-sm font-medium backdrop-blur-md transition-colors hover:bg-black/60">
                        <Store className="size-4" />
                        <span>Sklepy</span>
                    </button>

                    <Link
                        href={isSignedIn ? "/profile" : "/login"}
                        aria-label={accountLabel}
                        title={accountLabel}
                        className="flex size-10 shrink-0 items-center justify-center gap-2 rounded-full bg-black/35 px-3 text-sm font-medium backdrop-blur-md transition-colors hover:bg-black/60 min-[390px]:w-auto"
                    >
                        {isSignedIn ? <UserRound className="size-4" /> : <LogIn className="size-4" />}
                        <span className="hidden min-[390px]:inline">{isSignedIn ? "Profil" : "Zaloguj"}</span>
                    </Link>
                </div>
            </nav>
        </header>
    )
}
