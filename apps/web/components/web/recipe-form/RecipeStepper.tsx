import {cn} from "@/lib/utils";
import {Check, Pencil} from "lucide-react";


type RecipeStepperProps = {
    currentStep: number;
    totalSteps: number;
};

const steps = [
    "Dane przepisu",
    "Składniki",
    "Kroki",
];

export default function RecipeStepper({currentStep}: RecipeStepperProps) {

    return (
        <ol className="flex items-start max-w-5xl mx-auto" aria-label="Progress">
            {steps.map((step, index) => {

                return (
                    <li key={index} className="w-full">
                        <div className="flex items-center w-full relative">
                            <div className={cn(
                                "w-8 h-8 shrink-0 flex items-center justify-center rounded-full md:w-7 md:h-7",
                                currentStep > index && "bg-blue-700 dark:bg-blue-500",
                                currentStep <= index + 1 && "bg-slate-300 dark:bg-neutral-700"
                            )}>
                                {index + 1 === currentStep ? <Pencil/> : (
                                    currentStep <= index ? (<span>{index + 1}</span>) : <Check/>
                                )}
                            </div>
                            {index + 1 !== steps.length && <div className={cn(
                                "w-full h-0.5 mx-2 rounded-md sm:mx-4",
                                currentStep > index && "bg-blue-700 dark:bg-blue-500",
                                currentStep <= index + 1 && "bg-slate-300 dark:bg-neutral-700"
                            )}></div>}
                        </div>
                        <div className="mt-3 mr-4">
                            <p className={cn(
                                "text-sm font-semibold",
                                currentStep > index && "text-blue-700 dark:text-blue-500",
                                currentStep <= index + 1 && "text-slate-600 dark:text-slate-400",
                            )}>{step}</p>
                        </div>
                    </li>
                )
            })}
        </ol>
    );
}
