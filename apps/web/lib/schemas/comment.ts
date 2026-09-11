import z from 'zod';
import {Id} from "@gotujto/convex/_generated/dataModel";

export const commentSchema = z.object({
    body: z.string(),
    recipeId: z.custom<Id<"recipes">>(),
})