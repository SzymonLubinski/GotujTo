import {Doc} from "../../convex/_generated/dataModel";


export type RecipeProduct = {
    group: number
    ingredient: Doc<"ingredients">
    productName: string
    owned: boolean
}