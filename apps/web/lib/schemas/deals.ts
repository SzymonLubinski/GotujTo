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
        dealPrice: z.number().positive("Cena promocyjna musi być większa od 0").optional(),
        regularPrice: z.number().positive("Cena regularna musi być większa od 0").optional(),
        promotionDescription: z.string().trim().max(280, "Opis może mieć maksymalnie 280 znaków").optional(),
        startsAt: dateTimeSchema,
        endsAt: dateTimeSchema,
    })
    .refine(deal => new Date(deal.endsAt).getTime() > new Date(deal.startsAt).getTime(), {
        path: ["endsAt"],
        message: "Data zakończenia musi być późniejsza niż rozpoczęcia",
    })
    .superRefine((deal, context) => {
        const hasDealPrice = deal.dealPrice !== undefined;
        const hasRegularPrice = deal.regularPrice !== undefined;

        if (hasDealPrice !== hasRegularPrice) {
            context.addIssue({
                code: "custom",
                path: ["dealPrice"],
                message: "Podaj obie ceny albo pozostaw obie puste.",
            });
        }

        if (
            hasDealPrice &&
            hasRegularPrice &&
            deal.regularPrice <= deal.dealPrice
        ) {
            context.addIssue({
                code: "custom",
                path: ["regularPrice"],
                message: "Cena regularna musi być wyższa od promocyjnej.",
            });
        }

        if (
            !hasDealPrice &&
            !deal.promotionDescription?.trim()
        ) {
            context.addIssue({
                code: "custom",
                path: ["promotionDescription"],
                message: "Opisz promocję, gdy nie podajesz cen.",
            });
        }
    })

export const dealsFormSchema = z.object({
    deals: z.array(dealSchema).min(1, "Dodaj przynajmniej jedną promocję"),
})

export type DealsFormValues = z.infer<typeof dealsFormSchema>
