"use client"

import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

type FridgeResultsHeaderProps = {
    resultsCount: number
}

export default function FridgeShortsHeader({resultsCount}: FridgeResultsHeaderProps) {
    const router = useRouter()

    return (
        <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center">
            <div className="pointer-events-auto flex h-20 w-full max-w-md items-center gap-3 bg-linear-to-b from-black via-black/80 to-transparent px-4 pt-[env(safe-area-inset-top)] text-white backdrop-blur-sm">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/10 hover:text-white"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="size-5" />
                </Button>

                <div>
                    <h1 className="text-lg font-semibold">
                        Pasujące przepisy
                    </h1>

                    <p className="text-sm text-white/70">
                        Znaleźliśmy {resultsCount} pasujących przepisów
                    </p>
                </div>
            </div>
        </header>
    )
}