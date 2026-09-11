"use client"

import { FormEvent } from "react"
import { ArrowLeft, Search, X } from "lucide-react"
import { useRouter } from "next/navigation"

type SearchFormProps = {
    query: string
    onQueryChange: (query: string) => void
}

export default function SearchForm({ query, onQueryChange }: SearchFormProps) {
    const router = useRouter()

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
    }

    return (
        <header className="sticky top-0 z-40 border-b bg-background/95 px-4 py-3 backdrop-blur">
            <form onSubmit={handleSubmit} role="search" className="flex items-center gap-3">
                <button type="button" onClick={() => router.back()} aria-label="Wróć" className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-muted">
                    <ArrowLeft className="size-5" />
                </button>

                <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />

                    <input id="search" name="search" type="search" value={query} onChange={event => onQueryChange(event.target.value)} placeholder="Szukaj przepisów..." autoFocus enterKeyHint="search" className="h-11 w-full rounded-full bg-muted pl-10 pr-10 text-base outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" />

                    {query && (
                        <button type="button" onClick={() => onQueryChange("")} aria-label="Wyczyść wyszukiwanie" className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-background hover:text-foreground">
                            <X className="size-4" />
                        </button>
                    )}
                </div>
            </form>
        </header>
    )
}