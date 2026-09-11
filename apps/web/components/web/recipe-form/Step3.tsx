'use client';

import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import {
    Field,
    FieldContent,
    FieldError,
    FieldLabel,
} from "@/components/ui/field";

import { RecipeFormValues } from "@/lib/schemas/recipe";

export default function Step3() {
    const { control } = useFormContext<RecipeFormValues>();

    const { fields, append, remove } = useFieldArray({
        control,
        name: "step3",
    });

    return (
        <div className="space-y-6">

            {fields.map((item, index) => (
                <div
                    key={item.id}
                    className="rounded-xl border p-6 space-y-4"
                >
                    <div className="flex items-center justify-between">

                        <h3 className="font-semibold">
                            Krok {index + 1}
                        </h3>

                        {fields.length > 1 && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => remove(index)}
                            >
                                <X className="size-4" />
                            </Button>
                        )}

                    </div>

                    <Controller
                        name={`step3.${index}.description`}
                        control={control}
                        render={({ field, fieldState }) => (
                            <Field>
                                <FieldLabel>Opis</FieldLabel>

                                <FieldContent>

                                    <Textarea
                                        {...field}
                                        rows={5}
                                        placeholder="Opisz kolejny krok..."
                                        aria-invalid={fieldState.invalid}
                                    />

                                    {fieldState.error && (
                                        <FieldError
                                            errors={[fieldState.error]}
                                        />
                                    )}

                                </FieldContent>
                            </Field>
                        )}
                    />

                </div>
            ))}

            <Button
                type="button"
                variant="outline"
                onClick={() =>
                    append({
                        description: "",
                    })
                }
            >
                <Plus className="mr-2 size-4" />
                Dodaj krok
            </Button>

        </div>
    );
}