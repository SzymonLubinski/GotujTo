import type { ReactNode } from "react"


type StandardContentProps = {
    children: ReactNode
}


export default function StandardContent({children}: StandardContentProps) {
    return (
        <div className="pointer-events-none absolute inset-0 z-30 flex h-full w-full flex-col justify-between text-white">
            <div className="p-6 pt-24">
                <div className="inline-flex rounded-full bg-lime-400 px-3 py-1 text-sm font-semibold text-black">
                    Wypróbuj!
                </div>
            </div>

            <div className="bg-linear-to-t from-black via-black/70 to-transparent p-6 pb-32 pt-24">
                {children}
            </div>
        </div>
    )
}