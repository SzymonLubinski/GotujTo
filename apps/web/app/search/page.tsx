import { Suspense } from "react"
import SearchView from "@/components/web/search/SearchView"

export default function SearchPage() {
    return (
        <main className="mx-auto min-h-dvh w-full max-w-3xl bg-background">
            <Suspense fallback={<div className="min-h-dvh bg-background" />}>
                <SearchView />
            </Suspense>
        </main>
    )
}