"use client";

import {useState} from "react";
import {useFieldArray, useFormContext} from "react-hook-form";
import {Plus} from "lucide-react";
import {Button} from "@/components/ui/button";
import {RecipeFormValues} from "@/lib/schemas/recipe";
import IngredientGroupCard from "@/components/web/recipe-form/IngredientGroupCard";
import {customaryUnits, metricUnits} from "@gotujto/shared/data/stableData";
import {type Id} from "@gotujto/convex/_generated/dataModel";


const defaultIngredientGroup = {
    main: {
        productId: "" as Id<"products">,
        productName: "",
        metricUnit: metricUnits[0],
        customaryUnit: customaryUnits[0],
        metricQuantity: 1,
        customaryQuantity: 1,
        optional: false,
    },
    substitutes: [],
};

export default function Step2() {
    const {control} = useFormContext<RecipeFormValues>();
    const [openGroups, setOpenGroups] = useState<number[]>([0]);

    const {fields, append, remove} = useFieldArray({
        control,
        name: "step2",
    });

    const toggleGroup = (index: number) => {
        setOpenGroups((prev) =>
            prev.includes(index)
                ? prev.filter((item) => item !== index)
                : [...prev, index]
        );
    };

    const addIngredient = () => {
        append(defaultIngredientGroup);

        const newIndex = fields.length;

        setOpenGroups((prev) => [
            ...prev.filter((item) => item !== newIndex),
            newIndex,
        ]);
    };

    const removeIngredient = (index: number) => {
        remove(index);

        setOpenGroups((prev) =>
            prev
                .filter((item) => item !== index)
                .map((item) => (item > index ? item - 1 : item))
        );
    };

    return (
        <div className="space-y-6">
            {fields.map((field, index) => (
                <IngredientGroupCard
                    key={`${index}-${field}`}
                    groupIndex={index}
                    open={openGroups.includes(index)}
                    onOpenChange={() => toggleGroup(index)}
                    canRemove={fields.length > 1}
                    onRemove={() => removeIngredient(index)}
                />
            ))}

            <Button type="button" variant="outline" onClick={addIngredient}>
                <Plus className="mr-2 size-4"/>
                Dodaj składnik
            </Button>
        </div>
    );
}
