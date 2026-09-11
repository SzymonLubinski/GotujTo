"use client"

import { useState } from "react"
import { FormProvider, useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Trash2 } from "lucide-react"
import type { Id } from "@gotujto/convex/_generated/dataModel"
import { dealsFormSchema, type DealsFormValues } from "@/lib/schemas/deals"
import {DateTimeController, InputController, NumberInputController} from "@/components/controllers";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup } from "@/components/ui/field"
import ProductInputController from "@/components/controllers/ProductInputController";
import {addDealsAction} from "@/app/actions";

function toDateTimeLocalValue(date: Date) {
    const timezoneOffset = date.getTimezoneOffset() * 60_000
    return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16)
}

function createInitialDeal(): DealsFormValues["deals"][number] {
    const startsAt = new Date()
    const endsAt = new Date(startsAt)

    endsAt.setDate(endsAt.getDate() + 7)

    return {
        productId: "" as Id<"products">,
        store: "Lidl",
        dealPrice: 1,
        regularPrice: 2,
        startsAt: toDateTimeLocalValue(startsAt),
        endsAt: toDateTimeLocalValue(endsAt),
    }
}

export default function DealsForm() {
    const [initialValues] = useState<DealsFormValues>(() => ({deals: [createInitialDeal()]}))
    const [submitError, setSubmitError] = useState<string | null>(null)
    const [submitSuccess, setSubmitSuccess] = useState(false)

    const form = useForm<DealsFormValues>({
        resolver: zodResolver(dealsFormSchema),
        defaultValues: initialValues,
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "deals",
    })

    async function onSubmit(values: DealsFormValues) {
        setSubmitError(null)
        setSubmitSuccess(false)
        try {
            const response = await addDealsAction(values);
            form.reset({
                deals: [createInitialDeal()],
            })
            setSubmitSuccess(true)
        } catch (error) {
            setSubmitError(error instanceof Error ? error.message : "Nie udało się dodać promocji.")
        }
    }

    return (
        <div>
            <header className="mb-6">
                <h1 className="text-2xl font-semibold tracking-tight">Dodaj promocje</h1>
                <p className="mt-1 text-sm text-muted-foreground">Dodaj jednocześnie kilka promocji na produkty.</p>
            </header>
            <FormProvider {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-4">
                        {fields.map((deal, index) => (
                            <Card key={deal.id}>
                                <CardHeader className="flex flex-row items-start justify-between gap-4">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg">Promocja {index + 1}</CardTitle>
                                        <CardDescription>Wybierz produkt i uzupełnij dane promocji.</CardDescription>
                                    </div>
                                    <Button type="button"
                                            variant="ghost"
                                            size="icon"
                                            disabled={fields.length === 1}
                                            onClick={() => remove(index)}
                                            aria-label={`Usuń promocję ${index + 1}`}
                                    >
                                        <Trash2 className="size-4" />
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    <FieldGroup>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <ProductInputController name={`deals.${index}.productId`}
                                                                    label="Produkt"
                                            />
                                            <InputController name={`deals.${index}.store` as const}
                                                             label="Sklep"
                                                             placeholder="np. Lidl"
                                            />
                                        </div>
                                        <div className="grid gap-4 sm:grid-cols-3">
                                            <NumberInputController name={`deals.${index}.dealPrice` as const}
                                                                   label="Cena promocyjna"
                                            />
                                            <NumberInputController name={`deals.${index}.regularPrice` as const}
                                                                   label="Cena regularna"
                                                                   placeholder="Opcjonalnie"
                                            />
                                        </div>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <DateTimeController name={`deals.${index}.startsAt` as const}
                                                                label="Rozpoczęcie promocji"
                                            />
                                            <DateTimeController name={`deals.${index}.endsAt` as const}
                                                                label="Zakończenie promocji"
                                            />
                                        </div>
                                    </FieldGroup>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                    <Button type="button"
                            variant="outline"
                            className="w-full"
                            onClick={() => append(createInitialDeal())}
                    >
                        <Plus className="size-4" />
                        Dodaj kolejną promocję
                    </Button>
                    {submitError && (
                        <p role="alert" className="text-sm text-destructive">
                            {submitError}
                        </p>
                    )}
                    {submitSuccess && (
                        <p role="status" className="text-sm text-green-600">
                            Promocje zostały dodane.
                        </p>
                    )}
                    <Button type="submit"
                            className="w-full"
                            disabled={form.formState.isSubmitting}
                    >
                        {form.formState.isSubmitting ? "Zapisywanie..." : `Dodaj promocje (${fields.length})`}
                    </Button>
                </form>
            </FormProvider>
        </div>
    )
}
