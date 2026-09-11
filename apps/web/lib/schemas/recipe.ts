import z from "zod";
import {customaryUnits, dietTypes, mealTypes, metricUnits, occasions} from "../../../../packages/shared/data/stableData";
import {Id} from "@gotujto/convex/_generated/dataModel";

const requiredNumber = z
    .number({error: "Podaj ilość"})
    .positive("Ilość musi być większa od 0")

const imageFileSchema = z
    .file()
    .max(10 * 1024 * 1024, "Zdjęcie może mieć maksymalnie 10 MB")
    .mime(["image/jpeg", "image/png", "image/webp"], "Dozwolone formaty: JPG, PNG i WebP")

const videoFileSchema = z
    .file()
    .max(200 * 1024 * 1024, "Film może mieć maksymalnie 200 MB")
    .mime(["video/mp4", "video/webm"], "Dozwolone formaty: MP4 i WebM")

export const recipeImageSchema = z.object({
    id: z.string(),
    file: imageFileSchema,
    previewUrl: z.string(),
})

const storedRecipeImageSchema = z.object({
    id: z.string(),
    storageId: z.custom<Id<"_storage">>(),
    previewUrl: z.string(),
})

export const recipeVideoSchema = z.object({
    id: z.string(),
    file: videoFileSchema,
    previewUrl: z.string(),
})

const storedRecipeVideoSchema = z.object({
    id: z.string(),
    videoKey: z.string(),
    previewUrl: z.string(),
})

export const recipeSchema = z.object({
    name: z.string().trim().min(1, "Podaj nazwę przepisu"),
    cookingMinutes: requiredNumber,
    servings: requiredNumber,
    images: z.array(z.union([recipeImageSchema, storedRecipeImageSchema])).min(1, "Dodaj przynajmniej jedno zdjęcie").max(8, "Możesz dodać maksymalnie 8 zdjęć"),
    video: z.union([recipeVideoSchema, storedRecipeVideoSchema]).optional(),
    diets: z.array(z.enum(dietTypes)),
    types: z.array(z.enum(mealTypes)),
    occasions: z.array(z.enum(occasions)),
    description: z.string().optional(),
})

export const stepsSchema = z.object({
    stepNum: z.number().optional(),
    description: z.string().trim().min(1, "Opisz ten krok"),
})

export const ingredientSchema = z.object({
    productId: z.custom<Id<"products">>(value => typeof value === "string" && value.length > 0, "Wybierz produkt"),
    productName: z.string().optional(),
    metricUnit: z.enum(metricUnits),
    customaryUnit: z.enum(customaryUnits),
    metricQuantity: requiredNumber,
    customaryQuantity: requiredNumber,
    optional: z.boolean(),
})

export const ingredientGroupSchema = z.object({
    main: ingredientSchema,
    substitutes: z.array(ingredientSchema),
})

export const recipeFormSchema = z.object({
    step1: recipeSchema,
    step2: z.array(ingredientGroupSchema).min(1, "Dodaj przynajmniej jeden składnik"),
    step3: z.array(stepsSchema).min(1, "Dodaj przynajmniej jeden krok"),
});

export const addRecipeSchema = recipeFormSchema.extend({
    step1: recipeFormSchema.shape.step1
        .omit({
            images: true,
            video: true,
        })
        .extend({
            images: z.array(z.custom<Id<"_storage">>()),
            videoKey: z.string().optional(),
        }),
});

export type AddRecipeValues = z.infer<typeof addRecipeSchema>;
export type RecipeImageValue = z.infer<typeof recipeImageSchema>
export type RecipeVideoValue = z.infer<typeof recipeVideoSchema>
export type IngredientGroupType = z.infer<typeof ingredientGroupSchema>
export type RecipeFormValues = z.infer<typeof recipeFormSchema>;
