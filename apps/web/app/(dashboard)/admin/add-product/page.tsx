"use client"

import {Controller, FormProvider, useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {productSchema} from "@/lib/schemas/product";
import z from "zod";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Field, FieldError, FieldLabel} from "@/components/ui/field";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {productTypes} from "../../../../../../packages/shared/data/stableData";
import SelectController from "@/components/controllers/SelectController";
import {addProductAction} from "@/app/actions";
import {toast} from "sonner";
import {InputController} from "@/components/controllers";

export default function AddProductPage() {
    const form = useForm({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: '',
            image: undefined,
            type: 'nabiał'
        }
    })

    async function onSubmit(values: z.infer<typeof productSchema>) {
        try {
            const response = await addProductAction(values);
            toast.success(response)
        } catch {
            toast.error("błąd w procesie dodania produktu")
        }
    }

    return (
        <div className="py-12">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
                    Dodaj nowy produkt
                </h1>
                <p className="text-xl text-muted-foreground pt-4">
                    Dodaj nowy produkt który będzie można użyć w przepisach
                </p>
            </div>

            <Card className="w-full max-w-xl mx-auto">
                <CardHeader>
                    <CardTitle>Nowy Produkt</CardTitle>
                    <CardDescription>Podaj dane produktu</CardDescription>
                </CardHeader>
                <CardContent>
                    <FormProvider {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <Field className="gap-y-4">
                                <InputController name={"name"}
                                                 label={"Nazwa"}
                                                 placeholder={"podaj nazwę"}
                                />
                                <SelectController name={'type'}
                                                  label={'Typ produktu'}
                                                  items={productTypes.map(item => ({key: item}))}
                                />
                                <Controller
                                    name="image"
                                    control={form.control}
                                    render={({field, fieldState}) => (
                                        <Field>
                                            <FieldLabel>Zdjęcie (opcjonalnie)</FieldLabel>
                                            <Input
                                                aria-invalid={fieldState.invalid}
                                                placeholder="Super cool blog content"
                                                type="file"
                                                accept="image/*"
                                                onChange={(event) => {
                                                    const file = event.target.files?.[0];
                                                    field.onChange(file);
                                                }}
                                            />
                                            {fieldState.invalid && (
                                                <FieldError errors={[fieldState.error]}/>
                                            )}
                                        </Field>
                                    )}
                                />

                                <Button>
                                    <span>Utwórz produkt</span>
                                </Button>
                            </Field>
                        </form>
                    </FormProvider>
                </CardContent>
            </Card>
        </div>
    )
}