import {IngredientGroupType} from "@/lib/schemas/recipe";
import type {Id} from "@gotujto/convex/_generated/dataModel";

export const defaultIngredientsTest: IngredientGroupType[] =[
    {
        main: {
            productId: "j5736tk9kbhwazva9zk9mg862d89j8je" as Id<"products">,
            metricQuantity: 200,
            metricUnit: "g" as const,
            customaryQuantity: 1,
            customaryUnit: "szklanka" as const,
            optional: false,
        },
        substitutes: [
            {
                productId: "j5719hchwdz3efq9nbk8wssj4n89kkf3" as Id<"products">,
                metricQuantity: 200,
                metricUnit: "g" as const,
                customaryQuantity: 1,
                customaryUnit: "szklanka" as const,
                optional: false,
            }
        ]
    },
    {
        main: {
            productId: "j57705d5p680jq4z01y2656cen89jatj" as Id<"products">,
            metricQuantity: 100,
            metricUnit: "g" as const,
            customaryQuantity: 2,
            customaryUnit: "szt" as const,
            optional: false,
        },
        substitutes: []
    },
]

export const defaultProduct = {
    productId: "" as Id<"products">,
    metricQuantity: 1,
    metricUnit: "g" as const,
    customaryQuantity: 1,
    customaryUnit: "szt" as const,
    optional: false,
}