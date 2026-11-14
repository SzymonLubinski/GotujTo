"use client"

import type { FormEvent } from "react"
import Link from "next/link"
import Image from "next/image"
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
        <header className="shrink-0 border-b border-white/10 bg-black/95 px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-xl">
            <div className="mx-auto w-full max-w-3xl">
                <div className="mb-4 flex items-center justify-between">
                    <Link href="/" className="shrink-0" aria-label="GotujTo - strona główna">
                        <Image
                            src="/images/brand/gotujto-logo-dark.png"
                            alt="GotujTo"
                            width={160}
                            height={48}
                            priority
                            className="h-8 w-auto"
                        />
                    </Link>
                    <span className="text-sm text-white/50">Wyszukiwarka przepisów</span>
                </div>

                <form onSubmit={handleSubmit} role="search" className="flex items-center gap-3">
                    <button type="button" onClick={() => router.back()} aria-label="Wróć" className="flex size-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-colors hover:bg-white/10">
                        <ArrowLeft className="size-5" />
                    </button>

                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-white/45" />
                        <input id="search" name="search" type="search" value={query} onChange={event => onQueryChange(event.target.value)} placeholder="Szukaj przepisów, diet i okazji..." autoFocus enterKeyHint="search" className="h-11 w-full rounded-full border border-white/10 bg-white/10 pl-11 pr-10 text-base text-white outline-none placeholder:text-white/45 focus:border-lime-400/60 focus:bg-white/15 focus:ring-2 focus:ring-lime-400/20" />

                        {query && (
                            <button type="button" onClick={() => onQueryChange("")} aria-label="Wyczyść wyszukiwanie" className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white">
                                <X className="size-4" />
                            </button>
                        )}
                    </div>
                </form>

                <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-0.5 text-sm no-scrollbar">
                    <span className="shrink-0 text-white/45">Szybki filtr:</span>
                    <button type="button" onClick={() => onQueryChange("wege")} className="shrink-0 rounded-full border border-lime-400/25 bg-lime-400/10 px-3 py-1.5 font-medium text-lime-300 transition-colors hover:bg-lime-400/20">
                        Vege i wegan
                    </button>
                </div>
            </div>
        </header>
    )
}
