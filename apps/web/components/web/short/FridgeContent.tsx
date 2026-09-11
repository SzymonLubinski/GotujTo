import type { ReactNode } from "react"
import {getIngredientLabel} from "@gotujto/shared/functions/getIngredientLabel";

type FridgeContentProps = {
    matchPercentage: number
    matchedGroups: number
    requiredGroups: number
    children: ReactNode
}

export default function FridgeContent({ matchPercentage, matchedGroups, requiredGroups, children }: FridgeContentProps) {

    return (
        <div className="pointer-events-none absolute inset-0 z-30 flex h-full w-full flex-col justify-between text-white">
            <div className="p-6 pt-24">
                <div className="inline-flex rounded-full bg-lime-400 px-3 py-1 text-sm font-semibold text-black">
                    Dopasowanie {matchPercentage}%
                </div>
            </div>

            <div className="bg-linear-to-t from-black via-black/70 to-transparent p-6 pb-32 pt-24">
                <p className="mb-3 text-sm text-white/85">
                    Masz {matchedGroups} {getIngredientLabel(matchedGroups)} w lodówce
                </p>

                {children}
            </div>
        </div>
    )
}