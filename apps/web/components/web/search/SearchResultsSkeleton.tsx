export default function SearchResultsSkeleton() {
    return (
        <div className="mx-auto w-full max-w-3xl space-y-8 px-5 py-6">
            <div className="space-y-2"><div className="h-4 w-20 animate-pulse rounded bg-white/10" /><div className="h-8 w-44 animate-pulse rounded bg-white/10" /></div>
            {Array.from({ length: 3 }).map((_, sectionIndex) => (
                <div key={sectionIndex} className="space-y-3">
                    <div className="h-4 w-28 animate-pulse rounded-md bg-white/10" />
                    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                        {Array.from({ length: 2 }).map((_, itemIndex) => <div key={itemIndex} className="m-3 h-10 animate-pulse rounded-xl bg-white/10" />)}
                    </div>
                </div>
            ))}
        </div>
    )
}
