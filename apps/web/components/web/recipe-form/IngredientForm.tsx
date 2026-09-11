"use client";

import SelectController from "@/components/controllers/SelectController";
import {customaryUnits, metricUnits} from "@gotujto/shared/data/stableData";
import {NumberInputController} from "@/components/controllers";
import ProductInputController from "@/components/controllers/ProductInputController";
import {Controller, useFormContext, useWatch} from "react-hook-form";
import {RecipeFormValues} from "@/lib/schemas/recipe";

type IngredientFormProps = {
    name:
        | `step2.${number}.main`
        | `step2.${number}.substitutes.${number}`;
    setName?: (name: string) => void;
};

export default function IngredientForm({name, setName}: IngredientFormProps) {
    const {control, setValue} = useFormContext<RecipeFormValues>();
    const productName = useWatch({control, name: `${name}.productName`});

    const handleProductNameChange = (value: string) => {
        setValue(`${name}.productName`, value, {shouldDirty: true});
        setName?.(value);
    };

    return (
        <div className="relative space-y-6">
            <ProductInputController name={`${name}.productId`}
                                    label={"Produkt"}
                                    placeholder={"np. Mąka pszenna"}
                                    initialProductName={productName}
                                    onProductNameChange={handleProductNameChange}
            />
            <div className="grid grid-cols-2 gap-6">
                <SelectController
                    name={`${name}.metricUnit`}
                    label="Jednostka metryczna"
                    items={metricUnits.map(item => ({key: item}))}
                />
                <NumberInputController name={`${name}.metricQuantity`}
                                       label={"Ilość (metryczna)"}
                />
            </div>
            <div className="grid grid-cols-2 gap-6">
                <SelectController
                    name={`${name}.customaryUnit`}
                    label="Jednostka zwyczajowa"
                    items={customaryUnits.map(item => ({key: item}))}
                />
                <NumberInputController name={`${name}.customaryQuantity`}
                                       label={"Ilość (zwyczajowa)"}
                />
            </div>
            <Controller
                control={control}
                name={`${name}.optional`}
                render={({field}) => (
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={field.value} onChange={event => field.onChange(event.target.checked)} />
                        Składnik opcjonalny
                    </label>
                )}
            />
        </div>
    );
}
