"use server";

import z from "zod";
import {productSchema} from "@/lib/schemas/product";
import {fetchMutation, fetchQuery} from "convex/nextjs";
import {api} from "@gotujto/convex/_generated/api";
import {dealsFormSchema, DealsFormValues} from "@/lib/schemas/deals";

export async function addProductAction(value: z.infer<typeof productSchema>) {
    try {
        const parsed = productSchema.safeParse(value);
        if (!parsed.success) {
            return "produkt nie przeszedł analizy"
        }

        const isExisting = await fetchQuery(api.products.checkProductExists, {name: value.name.toLowerCase()})
        if (isExisting) {
            return `product ${value.name} już istnieje`
        }

        await fetchMutation(api.products.createProduct, {
            name: value.name.toLowerCase(),
            type: value.type,
        })
        return `dodano produkt ${value.name}`

    } catch {
        return "błąd w procesie dodania produktu"
    }
}

export async function addDealsAction(value: DealsFormValues) {
    try {
        const parsed = dealsFormSchema.safeParse(value);
        if (!parsed.success) {
            return {
                success: false,
                error: "promocje mają błędną walidację",
            };
        }

        const data = parsed.data.deals.map(item => ({
            ...item,
            startsAt: new Date(item.startsAt).getTime(),
            endsAt: new Date(item.endsAt).getTime(),
            lowerBy: item.regularPrice = item.dealPrice,
        }))
        await fetchMutation(api.deals.createDeals, {deals: data});

        return {success: true}
    } catch (error) {
        console.error("addRecipeAction:", error)
        return {
            success: false,
            error: "Nie udało się dodać przepisu",
        }
    }
}