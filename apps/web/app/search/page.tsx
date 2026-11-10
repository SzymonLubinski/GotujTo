import { Suspense } from "react"
import SearchView from "@/components/web/search/SearchView"

export default function SearchPage() {
    return (
        <main className="h-full overflow-hidden bg-black text-white">
            <Suspense fallback={<div className="min-h-dvh bg-background" />}>
                <SearchView />
            </Suspense>
        </main>
    )
}
