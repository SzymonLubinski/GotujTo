"use client"

import { useState } from "react"
import { Store } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { stores, type StoresT } from "@gotujto/shared/data/stableData"

type StoresSheetProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    selectedStores: StoresT[]
    onSelectedStoresChange: (stores: StoresT[]) => void
}

export default function StoresSheet({ open, onOpenChange, selectedStores, onSelectedStoresChange }: StoresSheetProps) {
    const [draftStores, setDraftStores] = useState<StoresT[]>(() => selectedStores.length === 0 ? [...stores] : selectedStores)

    const allStoresSelected = draftStores.length === stores.length
    const hasSelectedStores = draftStores.length > 0

    function handleStoreChange(store: StoresT, checked: boolean) {
        setDraftStores(currentStores => {
            if (!checked) {
                return currentStores.filter(currentStore => currentStore !== store)
            }

            return stores.filter(currentStore => currentStores.includes(currentStore) || currentStore === store)
        })
    }

    function handleOpenChange(nextOpen: boolean) {
        if (nextOpen) {
            setDraftStores(selectedStores.length === 0 ? [...stores] : selectedStores)
        }

        onOpenChange(nextOpen)
    }

    function handleSelectAll() {
        setDraftStores([...stores])
    }

    function handleApply() {
        if (!hasSelectedStores) {
            return
        }

        onSelectedStoresChange(allStoresSelected ? [] : draftStores)
        onOpenChange(false)
    }

    return (
        <Sheet open={open} onOpenChange={handleOpenChange}>
            <SheetContent side="bottom" showCloseButton={false} className="mx-auto max-h-[85dvh] w-full max-w-md rounded-t-3xl border-white/10 bg-zinc-950 px-0 text-white">
                <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-white/25" />

                <SheetHeader className="px-6 pt-3 text-left">
                    <SheetTitle className="text-2xl text-white">Wybierz sklepy</SheetTitle>

                    <SheetDescription className="text-white/60">
                        Zaznacz sklepy, których promocje mają być uwzględniane w przepisach.
                    </SheetDescription>
                </SheetHeader>

                <div className="overflow-y-auto px-6 py-4">
                    <div className="divide-y divide-white/10">
                        {stores.map(store => {
                            const checked = draftStores.includes(store)

                            return (
                                <label key={store} htmlFor={`store-${store}`} className="flex cursor-pointer items-center justify-between py-4">
                                    <span className="flex items-center gap-3">
                                        <span className="flex size-10 items-center justify-center rounded-xl bg-white/10">
                                            <Store className="size-5 text-lime-400" />
                                        </span>

                                        <span className="text-base font-medium">{store}</span>
                                    </span>

                                    <Checkbox id={`store-${store}`} checked={checked} onCheckedChange={value => handleStoreChange(store, value === true)} className="size-6 border-white/30 data-[state=checked]:border-lime-400 data-[state=checked]:bg-lime-400 data-[state=checked]:text-black" />
                                </label>
                            )
                        })}
                    </div>

                    {!hasSelectedStores && (
                        <p className="mt-3 text-sm text-red-400">
                            Wybierz przynajmniej jeden sklep.
                        </p>
                    )}
                </div>

                <SheetFooter className="grid grid-cols-2 gap-3 border-t border-white/10 px-6 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4">
                    <Button type="button" variant="outline" onClick={handleSelectAll} disabled={allStoresSelected} className="h-12 rounded-full border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white">
                        Wszystkie
                    </Button>

                    <Button type="button" onClick={handleApply} disabled={!hasSelectedStores} className="h-12 rounded-full bg-lime-400 font-semibold text-black hover:bg-lime-300">
                        Zastosuj
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}