import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {useMemo} from "react";
import type {Doc} from "@gotujto/convex/_generated/dataModel";

type RecipeStepsProps = {
    steps: Doc<"steps">[]
}

export default function RecipeSteps({steps}: RecipeStepsProps) {
    const sortedSteps = useMemo(() => {
        return [...steps].sort((a, b) => a.stepNum - b.stepNum)
    }, [steps])

    return (
        <section className="space-y-6">
            <div>
                <p className="text-sm text-muted-foreground">{sortedSteps.length} kroków</p>
                <h2 className="text-2xl font-bold tracking-tight">Przygotowanie</h2>
            </div>
            <ol className="space-y-5">
                {sortedSteps.map((step, index) => (
                    <li key={step._id} className="relative grid grid-cols-[2.5rem_minmax(0,1fr)] gap-4">
                        <div className="flex flex-col items-center">
                                    <span
                                        className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                                        {step.stepNum}
                                    </span>

                            {index < sortedSteps.length - 1 && <span className="mt-2 h-full w-px bg-border"/>}
                        </div>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg">Krok {step.stepNum}</CardTitle>
                            </CardHeader>

                            <CardContent>
                                <p className="leading-7 text-muted-foreground">{step.description}</p>
                            </CardContent>
                        </Card>
                    </li>
                ))}
            </ol>
        </section>
    )
}