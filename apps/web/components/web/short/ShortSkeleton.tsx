import { Skeleton } from "@/components/ui/skeleton"

export default function ShortSkeleton() {
    return (
        <div className="relative h-full w-full overflow-hidden bg-black">
            <Skeleton className="absolute inset-0 rounded-none bg-white/10" />

            <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex gap-2">
                    <span className="size-2 animate-pulse rounded-full bg-white/70" />
                    <span className="size-2 animate-pulse rounded-full bg-white/70 [animation-delay:150ms]" />
                    <span className="size-2 animate-pulse rounded-full bg-white/70 [animation-delay:300ms]" />
                </div>
            </div>

            <div className="absolute inset-x-0 bottom-0 space-y-3 bg-linear-to-t from-black via-black/70 to-transparent p-6 pb-24 pt-24">
                <Skeleton className="h-9 w-4/5 bg-white/20" />
                <Skeleton className="h-5 w-2/3 bg-white/20" />
            </div>
        </div>
    )
}