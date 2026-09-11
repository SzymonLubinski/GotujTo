

export function RecipeDetailsSkeleton() {
    return (
        <div className="mx-auto min-h-screen w-full max-w-3xl animate-pulse bg-background">
            <div className="h-[68svh] bg-muted" />

            <div className="space-y-8 px-5 py-8">
                <div className="h-8 w-40 rounded-lg bg-muted" />
                <div className="h-48 rounded-2xl bg-muted" />
                <div className="h-8 w-48 rounded-lg bg-muted" />
                <div className="h-72 rounded-2xl bg-muted" />
            </div>
        </div>
    )
}