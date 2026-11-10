"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@gotujto/convex/_generated/api"
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue"
import SearchForm from "./SearchForm"
import SearchResults from "./SearchResults"
import SearchResultsSkeleton from "./SearchResultsSkeleton"

const SEARCH_DEBOUNCE_MS = 300

export default function SearchView() {
    const [query, setQuery] = useState<string>('')
    const debouncedQuery = useDebouncedValue(query.trim(), SEARCH_DEBOUNCE_MS)

    const results = useQuery(
        api.recipes.searchRecipes, debouncedQuery
            ? {
                query: debouncedQuery
            }
            : "skip"
    )

    return (
        <div className="relative flex h-full flex-col overflow-hidden">
            <SearchForm query={query} onQueryChange={setQuery} />
            <div className="feed-desktop-scrollbar-gutter flex-1 overflow-y-auto pb-24">
                {debouncedQuery && !results ? <SearchResultsSkeleton /> : <SearchResults query={debouncedQuery} results={results} />}
            </div>
        </div>
    )
}
