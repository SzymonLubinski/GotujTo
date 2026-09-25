import {z} from "zod";

const recipeContextSchema = z.object({
    id: z.string().min(1).max(128),
    name: z.string().trim().min(1).max(200),
    url: z.string().url().max(2_000),
});

export const contactSubmissionSchema = z.object({
    category: z.enum([
        "contact",
        "recipe-ingredients",
        "recipe-steps",
        "recipe-photo",
        "recipe-other",
    ]),
    email: z.union([z.string().trim().email(), z.literal("")]),
    message: z.string().trim().min(10).max(3_000),
    recipe: recipeContextSchema.optional(),
    honeypot: z.string().max(0),
    formStartedAt: z.number().int().positive(),
});

export type ContactSubmission = z.infer<typeof contactSubmissionSchema>;
