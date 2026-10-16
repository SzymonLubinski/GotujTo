import type {ReactNode} from "react";
import {Store} from "lucide-react";

import {getIngredientLabel} from "@gotujto/shared/functions/getIngredientLabel";

type DealContentProps = {
    dealIngredientCount: number;
    dealStores?: string[];
    thrift: number;
    children: ReactNode;
};

function formatSavings(value: number) {
    return new Intl.NumberFormat("pl-PL", {
        style: "currency",
        currency: "PLN",
        minimumFractionDigits: value % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2,
    }).format(value);
}

export default function DealContent({
    dealIngredientCount,
    dealStores,
    thrift,
    children,
}: DealContentProps) {
    const stores = Array.isArray(dealStores) ? [...new Set(dealStores)] : [];

    return (
        <div className="pointer-events-none absolute inset-0 z-30 flex h-full w-full flex-col justify-between text-white">
            <div className="max-w-[calc(100%-4.5rem)] p-6 pt-24">
                <div className="rounded-2xl border border-white/15 bg-black/65 p-3.5 shadow-xl backdrop-blur-sm">
                    {thrift > 0 && (
                        <p className="text-lg font-bold text-lime-300">
                            Taniej do {formatSavings(thrift)}!
                        </p>
                    )}
                    <div className={thrift > 0 ? "mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-white/90" : "flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-white/90"}>
                        <span>
                            W promocji: {dealIngredientCount} {getIngredientLabel(dealIngredientCount)}
                        </span>

                        {stores.length > 0 && (
                            <span className="inline-flex items-center gap-1.5 text-white/80">
                                <span aria-hidden className="text-white/40">•</span>
                                <Store className="size-3.5 text-lime-300" />
                                {stores.join(", ")}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-linear-to-t from-black via-black/70 to-transparent p-6 pb-[calc(env(safe-area-inset-bottom)+5rem)] pr-24 pt-24">
                {children}
            </div>
        </div>
    );
}
