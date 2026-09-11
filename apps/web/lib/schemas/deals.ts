import z from "zod";
import {Id} from "@gotujto/convex/_generated/dataModel";
import {stores} from "@gotujto/shared/data/stableData";

export const dateTimeSchema = z.string().min(1, "Wybierz datę").refine(value => !Number.isNaN(new Date(value).getTime()), {
    message: "Nieprawidłowa data",
})

export const dealSchema = z
    .object({
        productId: z.custom<Id<"products">>(),
        store: z.enum(stores),
        dealPrice: z.number().positive("Cena promocyjna musi być większa od 0"),
        regularPrice: z.number().positive("Cena regularna musi być większa od 0"),
        startsAt: dateTimeSchema,
        endsAt: dateTimeSchema,
    })
    .refine(deal => new Date(deal.endsAt).getTime() > new Date(deal.startsAt).getTime(), {
        path: ["endsAt"],
        message: "Data zakończenia musi być późniejsza niż rozpoczęcia",
    })

export const dealsFormSchema = z.object({
    deals: z.array(dealSchema).min(1, "Dodaj przynajmniej jedną promocję"),
})

export type DealsFormValues = z.infer<typeof dealsFormSchema>