"use client";

import {useState} from "react";
import {useFieldArray, useFormContext} from "react-hook-form";
import {ChevronDown, Plus, X} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Collapsible, CollapsibleContent, CollapsibleTrigger} from "@/components/ui/collapsible";
import {cn} from "@/lib/utils";
import {RecipeFormValues} from "@/lib/schemas/recipe";
import IngredientForm from "@/components/web/recipe-form/IngredientForm";
import {customaryUnits, metricUnits} from "@gotujto/shared/data/stableData";
import {type Id} from "@gotujto/convex/_generated/dataModel";

const emptyProduct = {
    productId: "" as Id<"products">,
    productName: "",
    metricUnit: metricUnits[0],
    customaryUnit: customaryUnits[0],
    metricQuantity: 1,
    customaryQuantity: 1,
    optional: false,
};

type SubstituteListProps = {
    groupIndex: number;
    onAddSubstitute: () => void;
};

export default function SubstituteList({groupIndex, onAddSubstitute}: SubstituteListProps) {
    const {control} = useFormContext<RecipeFormValues>();
    const [openSubstitutes, setOpenSubstitutes] = useState<number[]>([]);

    const {fields, append, remove} = useFieldArray({
        control,
        name: `step2.${groupIndex}.substitutes`,
    });

    const toggleSubstitute = (index: number) => {
        setOpenSubstitutes((prev) =>
            prev.includes(index)
                ? prev.filter((item) => item !== index)
                : [...prev, index]
        );
    };

    const addSubstitute = () => {
        append(emptyProduct);
        onAddSubstitute();
        const newIndex = fields.length;
        setOpenSubstitutes((prev) => {
            return [
                ...prev.filter((item) => item !== newIndex),
                newIndex,
            ]
        });
    };

    const removeSubstitute = (index: number) => {
        remove(index);

        setOpenSubstitutes((prev) => prev
            .filter((item) => item !== index)
            .map((item) => (item > index ? item - 1 : item))
        );
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="font-medium">Zamienniki</h4>
            </div>

            {fields.map((field, substituteIndex) => {
                const open = openSubstitutes.includes(substituteIndex);

                return (
                    <Collapsible key={field.id} open={open} onOpenChange={() => toggleSubstitute(substituteIndex)}>
                        <div className="rounded-lg border">
                            <div className="flex h-14 items-center justify-between px-4">
                                <CollapsibleTrigger className="flex items-center gap-3">
                                    <ChevronDown className={cn("size-4 transition-transform", !open && "-rotate-90")}/>
                                    <span className="font-medium">Zamiennik {substituteIndex + 1}</span>
                                </CollapsibleTrigger>

                                <Button type="button" variant="ghost" size="icon"
                                        onClick={() => removeSubstitute(substituteIndex)}>
                                    <X className="size-4"/>
                                </Button>
                            </div>

                            <CollapsibleContent>
                                <div className="border-t p-4">
                                    <IngredientForm name={`step2.${groupIndex}.substitutes.${substituteIndex}`}/>
                                </div>
                            </CollapsibleContent>
                        </div>
                    </Collapsible>
                );
            })}
            <div className="flex items-center justify-between">
                <Button type="button" variant="outline" size="sm" onClick={addSubstitute}>
                    <Plus className="mr-2 size-4"/>
                    Dodaj zamiennik
                </Button>
            </div>
        </div>
    );
}
