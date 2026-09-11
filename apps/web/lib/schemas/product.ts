
import z from 'zod';
import {productTypes} from "@gotujto/shared/data/stableData";

export const productSchema = z.object({
    name: z.string(),
    image: z.instanceof(File).optional(),
    type: z.enum(productTypes)
})