"use client";

import {useState} from "react";
import {useFormContext, useWatch} from "react-hook-form";
import {ChevronDown, X} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Collapsible, CollapsibleContent, CollapsibleTrigger} from "@/components/ui/collapsible";
import {cn} from "@/lib/utils";
import IngredientForm from "@/components/web/recipe-form/IngredientForm";
import SubstituteList from "@/components/web/recipe-form/SubstituteList";
import {RecipeFormValues} from "@/lib/schemas/recipe";

type IngredientGroupCardProps = {
    groupIndex: number;
    open: boolean;
    onOpenChange: () => void;
    onRemove: () => void;
    canRemove: boolean;
};

export default function IngredientGroupCard({groupIndex, open, onOpenChange, onRemove, canRemove}: IngredientGroupCardProps) {
    const [mainOpen, setMainOpen] = useState(true);
    const {control} = useFormContext<RecipeFormValues>();
    const watchedProductName = useWatch({control, name: `step2.${groupIndex}.main.productName`});
    const [mainProductName, setMainProductName] = useState<string | null>(watchedProductName ?? null);


    return (
        <Collapsible open={open} onOpenChange={onOpenChange}>
            <div className="rounded-xl border">
                <div className="flex h-20 items-center justify-between px-6">
                    <CollapsibleTrigger className="flex items-center gap-3">
                        <ChevronDown className={cn("size-4 transition-transform", !open && "-rotate-90")}/>
                        <span className="font-semibold">
                            {mainProductName || watchedProductName || `Składnik ${groupIndex + 1}`}
                        </span>
                    </CollapsibleTrigger>
                    {canRemove && (
                        <Button type="button" variant="ghost" size="icon" onClick={onRemove}>
                            <X className="size-4"/>
                        </Button>
                    )}
                </div>

                <CollapsibleContent>
                    <div className="space-y-6 border-t p-6">
                        <Collapsible open={mainOpen} onOpenChange={setMainOpen}>
                            <IngredientForm name={`step2.${groupIndex}.main`}
                                            setName={setMainProductName}
                            />
                        </Collapsible>
                        <SubstituteList
                            groupIndex={groupIndex}
                            onAddSubstitute={() => setMainOpen(false)}
                        />
                    </div>
                </CollapsibleContent>
            </div>
        </Collapsible>
    );
}
