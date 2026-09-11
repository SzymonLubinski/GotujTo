import { Skeleton } from "@/components/ui/skeleton"

export default function FridgeShortsSkeleton() {
    return (
        <div className="h-full overflow-hidden bg-black">
            <div className="relative mx-auto h-full w-full max-w-md">
                <Skeleton className="absolute inset-0 rounded-none" />

                <div className="absolute inset-x-0 bottom-0 p-6 pb-24 pt-24">
                    <Skeleton className="mb-4 h-8 w-32 rounded-full" />

                    <Skeleton className="h-10 w-4/5" />

                    <div className="mt-4 flex gap-3">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-5 w-20" />
                    </div>

                    <div className="mt-6">
                        <Skeleton className="h-5 w-40" />
                    </div>
                </div>
            </div>
        </div>
    )
}