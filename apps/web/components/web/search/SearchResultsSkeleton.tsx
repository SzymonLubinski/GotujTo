

export default function SearchResultsSkeleton() {
    return (
        <div className="space-y-6 p-4">
            {Array.from({ length: 3 }).map((_, sectionIndex) => (
                <div key={sectionIndex} className="space-y-3">
                    <div className="h-6 w-28 animate-pulse rounded-md bg-muted" />

                    <div className="space-y-2">
                        {Array.from({ length: 2 }).map((_, itemIndex) => (
                            <div key={itemIndex} className="h-14 animate-pulse rounded-xl bg-muted" />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}