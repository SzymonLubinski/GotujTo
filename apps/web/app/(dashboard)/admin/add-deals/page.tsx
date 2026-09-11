import { Suspense } from "react"
import DealsForm from "@/components/web/deals-form/DealsForm"
import DealsFormSkeleton from "@/components/web/deals-form/DealsFormSkeleton"

export default function AddDealsPage() {
    return (
        <main className="mx-auto min-h-dvh w-full max-w-5xl p-4 sm:p-6">
            <Suspense fallback={<DealsFormSkeleton />}>
                <DealsForm />
            </Suspense>
        </main>
    )
}