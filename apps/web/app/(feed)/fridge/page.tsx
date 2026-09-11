"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "convex/react"
import { ArrowLeft, ChefHat, LoaderCircle, Plus, Search, X } from "lucide-react"
import { api } from "@gotujto/convex//_generated/api"
import type { Doc } from "@gotujto/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function FridgePage() {
    const router = useRouter()
    const [isPending, startTransition] = useTransition();
    const [phrase, setPhrase] = useState("")
    const [selectedProducts, setSelectedProducts] = useState<Doc<"products">[]>([])
    const [suggestionsOpen, setSuggestionsOpen] = useState(false)

    const suggestions = useQuery(
        api.products.searchProducts,
        phrase.trim().length >= 2 ? { phrase } : "skip"
    )

    const filteredSuggestions = suggestions?.filter((product) => {
        return !selectedProducts.some((selectedProduct) => selectedProduct._id === product._id)
    })

    function handleSelectProduct(product: Doc<"products">) {
        setSelectedProducts((currentProducts) => [...currentProducts, product])
        setPhrase("")
        setSuggestionsOpen(false)
    }

    function handleRemoveProduct(productId: Doc<"products">["_id"]) {
        setSelectedProducts((currentProducts) => currentProducts.filter((product) => product._id !== productId))
    }

    function handleShowRecipes() {
        const params = new URLSearchParams()
        selectedProducts.forEach((product) => {
            params.append("productId", product._id)
        })
        startTransition(() => {
            router.push(`/fridge/results?${params.toString()}`);
        });
    }

    return (
        <div className="no-scrollbar h-full overflow-y-auto bg-black pb-28 text-white">
            <div className="mx-auto min-h-full w-full max-w-md px-5">
                <header className="flex h-16 items-center border-b border-white/10">
                    <Button type="button" variant="ghost" size="icon" aria-label="Wróć" className="text-white hover:bg-white/10 hover:text-white" onClick={() => router.back()}>
                        <ArrowLeft className="size-5" />
                    </Button>

                    <h1 className="flex-1 pr-10 text-center text-lg font-semibold">
                        Mam w lodówce
                    </h1>
                </header>

                <main className="py-7">
                    <section>
                        <h2 className="text-3xl font-bold tracking-tight">
                            Co masz w lodówce?
                        </h2>

                        <p className="mt-2 text-sm text-white/60">
                            Wyszukaj i dodaj produkty, które masz.
                        </p>

                        <div className="relative mt-6">
                            <Search className="pointer-events-none absolute left-3 top-1/2 z-10 size-5 -translate-y-1/2 text-white/40" />

                            <Input
                                type="text"
                                value={phrase}
                                placeholder="Wyszukaj produkt..."
                                className="h-14 border-white/15 bg-white/5 pl-11 pr-12 text-white placeholder:text-white/40 focus-visible:border-lime-400 focus-visible:ring-lime-400/20"
                                onFocus={() => setSuggestionsOpen(true)}
                                onChange={(event) => {
                                    setPhrase(event.target.value)
                                    setSuggestionsOpen(true)
                                }}
                            />

                            {phrase && (
                                <Button type="button" variant="ghost" size="icon" aria-label="Wyczyść wyszukiwanie" className="absolute right-2 top-1/2 -translate-y-1/2 text-white/50 hover:bg-white/10 hover:text-white" onClick={() => setPhrase("")}>
                                    <X className="size-4" />
                                </Button>
                            )}

                            {suggestionsOpen && phrase.trim().length >= 2 && (
                                <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-white/10 bg-zinc-950 shadow-2xl">
                                    {suggestions === undefined && (
                                        <p className="px-4 py-3 text-sm text-white/50">
                                            Wyszukiwanie...
                                        </p>
                                    )}

                                    {filteredSuggestions?.length === 0 && (
                                        <p className="px-4 py-3 text-sm text-white/50">
                                            Nie znaleziono produktu.
                                        </p>
                                    )}

                                    {filteredSuggestions?.map((product) => (
                                        <button type="button" key={product._id} className="flex w-full items-center justify-between border-b border-white/5 px-4 py-3 text-left last:border-b-0 hover:bg-white/5" onMouseDown={(event) => event.preventDefault()} onClick={() => handleSelectProduct(product)}>
                                            <span>{product.name}</span>
                                            <Plus className="size-4 text-lime-400" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="mt-8">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">
                                Twoje produkty
                            </h3>

                            <span className="text-sm text-white/50">
                                {selectedProducts.length}
                            </span>
                        </div>

                        {selectedProducts.length > 0 ? (
                            <div className="mt-4 flex flex-wrap gap-2">
                                {selectedProducts.map((product) => (
                                    <div key={product._id} className="flex items-center gap-2 rounded-full bg-white/10 py-2 pl-4 pr-2 text-sm">
                                        <span>{product.name}</span>

                                        <button type="button" aria-label={`Usuń ${product.name}`} className="flex size-6 items-center justify-center rounded-full text-white/50 hover:bg-white/10 hover:text-white" onClick={() => handleRemoveProduct(product._id)}>
                                            <X className="size-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="mt-4 rounded-2xl border border-dashed border-white/15 px-5 py-10 text-center">
                                <p className="text-sm text-white/50">
                                    Dodaj przynajmniej jeden produkt.
                                </p>
                            </div>
                        )}
                    </section>

                    <Button
                        type="button"
                        disabled={
                            selectedProducts.length === 0 ||
                            isPending
                        }
                        className="mt-10 h-14 w-full bg-lime-400 text-base font-semibold text-black hover:bg-lime-300 disabled:bg-white/10 disabled:text-white/30"
                        onClick={handleShowRecipes}
                    >
                        {isPending ? (
                            <>
                                <LoaderCircle className="size-5 animate-spin" />
                                Ładowanie przepisów...
                            </>
                        ) : (
                            <>
                                <ChefHat className="size-5" />
                                Pokaż pasujące przepisy
                            </>
                        )}
                    </Button>
                </main>
            </div>
        </div>
    )
}