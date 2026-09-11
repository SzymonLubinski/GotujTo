"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export function RecipeHeaderNavigation() {
    const router = useRouter()

    return (
        <nav className="absolute inset-x-0 top-0 z-20 flex items-center justify-between p-4">
            <Button
                variant="secondary"
                size="icon"
                className="rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70"
                onClick={() => router.back()}
            >
                <ArrowLeft className="size-5" />
            </Button>
        </nav>
    )
}