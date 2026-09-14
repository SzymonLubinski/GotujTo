"use server";

import z from "zod";
import {productSchema} from "@/lib/schemas/product";
import {fetchMutation, fetchQuery} from "convex/nextjs";
import {api} from "@gotujto/convex/_generated/api";
import {dealsFormSchema, DealsFormValues} from "@/lib/schemas/deals";
import {requireAdminRequest} from "@/lib/auth/requireAdminRequest";
import type {FunctionArgs} from "convex/server";
import {revalidatePath} from "next/cache";
import {DeleteObjectCommand} from "@aws-sdk/client-s3";
import {r2} from "@/lib/cloud/r2";

type CreateRecipeValues = Omit<
    FunctionArgs<typeof api.recipes.createRecipe>,
    "adminSecret"
>;

type UpdateRecipeValues = Omit<
    FunctionArgs<typeof api.recipes.updateRecipe>,
    "adminSecret"
>;

function getAdminSecret() {
    const adminSecret =
        process.env.ADMIN_CONVEX_SECRET;

    if (!adminSecret) {
        throw new Error(
            "Brak zmiennej ADMIN_CONVEX_SECRET.",
        );
    }

    return adminSecret;
}

export async function addProductAction(value: z.infer<typeof productSchema>) {
    await requireAdminRequest();
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
            adminSecret: process.env.ADMIN_CONVEX_SECRET,
            name: value.name.toLowerCase(),
            type: value.type,
        })
        return `dodano produkt ${value.name}`

    } catch {
        return "błąd w procesie dodania produktu"
    }
}

export async function addDealsAction(value: DealsFormValues) {
    await requireAdminRequest();
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
        await fetchMutation(api.deals.createDeals, {
            adminSecret: process.env.ADMIN_CONVEX_SECRET,
            deals: data
        });

        return {success: true}
    } catch (error) {
        console.error("dodanie promocji:", error)
        return {
            success: false,
            error: "błąd w procesie dodania promocji",
        }
    }
}

export async function createRecipe(value: CreateRecipeValues,) {
    await requireAdminRequest();

    try {
        return await fetchMutation(
            api.recipes.createRecipe,
            {
                ...value,
                adminSecret: getAdminSecret(),
            },
        );
    } catch (error) {
        console.error("createRecipe:", error);
        throw new Error(
            "Nie udało się dodać przepisu.",
        );
    }
}

export async function updateRecipe(value: UpdateRecipeValues,) {
    await requireAdminRequest();

    try {
        return await fetchMutation(
            api.recipes.updateRecipe,
            {
                ...value,
                adminSecret: getAdminSecret(),
            },
        );
    } catch (error) {
        console.error("updateRecipe:", error);
        throw new Error(
            "Nie udało się zaktualizować przepisu.",
        );
    }
}

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

const allowedImageTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
]);

type ImageUploadInput = {
    contentType: string;
    size: number;
};

export async function generateImageUploadUrlAction({contentType, size}: ImageUploadInput) {
    await requireAdminRequest();

    if (!allowedImageTypes.has(contentType)) {
        throw new Error("Dozwolone formaty: JPG, PNG i WebP.");
    }

    if (
        !Number.isSafeInteger(size) ||
        size <= 0 ||
        size > MAX_IMAGE_SIZE
    ) {
        throw new Error("Zdjęcie może mieć maksymalnie 10 MB.");
    }

    return await fetchMutation(
        api.recipes.generateImageUploadUrl,
        {
            adminSecret: getAdminSecret(),
        },
    );
}

type SaveDraftArgs = Omit<
    FunctionArgs<
        typeof api.recipeImports.saveDraft
    >,
    "adminSecret"
>;

export async function saveDraftAction(
    args: SaveDraftArgs,
) {
    await requireAdminRequest();

    await fetchMutation(
        api.recipeImports.saveDraft,
        {
            ...args,
            adminSecret: getAdminSecret(),
        },
    );

    return {
        success: true,
    };
}

export async function deleteRecipeAction(recipeId: Id<"recipes">) {
    await requireAdminRequest();

    const result = await fetchMutation(api.recipes.deleteRecipe, {
        recipeId,
        adminSecret: getAdminSecret(),
    });

    const bucketName = process.env.R2_BUCKET_NAME;

    if (result.videoKey && bucketName) {
        try {
            await r2.send(
                new DeleteObjectCommand({
                    Bucket: bucketName,
                    Key: result.videoKey,
                }),
            );
        } catch (error) {
            console.error("Nie udało się usunąć filmu z R2:", error);
        }
    }

    revalidatePath("/");
    revalidatePath("/admin/recipes");
    revalidatePath(`/recipe/${recipeId}`);

    return {success: true};
}