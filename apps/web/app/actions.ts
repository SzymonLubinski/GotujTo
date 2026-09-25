"use server";

import z from "zod";
import {productSchema} from "@/lib/schemas/product";
import {fetchAction, fetchMutation, fetchQuery} from "convex/nextjs";
import {api} from "@gotujto/convex/_generated/api";
import {dealsFormSchema, DealsFormValues} from "@/lib/schemas/deals";
import {requireAdminRequest} from "@/lib/auth/requireAdminRequest";
import type {FunctionArgs} from "convex/server";
import {revalidatePath} from "next/cache";
import {DeleteObjectCommand} from "@aws-sdk/client-s3";
import {r2} from "@/lib/cloud/r2";
import {Id} from "@gotujto/convex/_generated/dataModel";
import {headers} from "next/headers";
import {createHmac} from "node:crypto";
import {Resend, type ErrorResponse} from "resend";
import {
    contactSubmissionSchema,
    type ContactSubmission,
} from "@/lib/schemas/contact";

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

        const data = parsed.data.deals.map(item => {
            const lowerBy =
                item.dealPrice !== undefined &&
                item.regularPrice !== undefined
                    ? item.regularPrice - item.dealPrice
                    : undefined;

            return {
                ...item,
                promotionDescription:
                    item.promotionDescription?.trim() ||
                    undefined,
                startsAt: new Date(item.startsAt).getTime(),
                endsAt: new Date(item.endsAt).getTime(),
                lowerBy,
            };
        });
        await fetchMutation(api.deals.createDeals, {
            adminSecret: getAdminSecret(),
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

function getContactConfig() {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;
    const recipient = process.env.CONTACT_RECIPIENT_EMAIL;
    const rateLimitSecret = process.env.CONTACT_RATE_LIMIT_SECRET;

    if (!apiKey || !from || !recipient || !rateLimitSecret) {
        throw new Error("Brak konfiguracji formularza kontaktowego.");
    }

    return {apiKey, from, recipient, rateLimitSecret};
}

function getClientIp(requestHeaders: Headers) {
    const forwardedFor = requestHeaders.get("x-forwarded-for");

    if (forwardedFor) {
        return forwardedFor.split(",")[0]?.trim() ?? "unknown";
    }

    return requestHeaders.get("x-real-ip") ?? "unknown";
}

function formatRetryAfter(retryAfterSeconds: number) {
    const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));

    return `Spróbuj ponownie za około ${minutes} min.`;
}

function getContactSubject(submission: ContactSubmission) {
    if (!submission.recipe) {
        return "Wiadomość z formularza kontaktowego GotujTo";
    }

    return `Zgłoszenie błędu: ${submission.recipe.name}`;
}

function getContactText(submission: ContactSubmission) {
    const categoryLabels = {
        contact: "Kontakt",
        "recipe-ingredients": "Składniki",
        "recipe-steps": "Kroki przygotowania",
        "recipe-photo": "Zdjęcie lub film",
        "recipe-other": "Inny problem",
    };

    return [
        `Kategoria: ${categoryLabels[submission.category]}`,
        submission.recipe
            ? `Przepis: ${submission.recipe.name} (${submission.recipe.id})`
            : null,
        submission.recipe
            ? `Adres przepisu: ${submission.recipe.url}`
            : null,
        submission.email
            ? `E-mail zwrotny: ${submission.email}`
            : "E-mail zwrotny: nie podano",
        "",
        "Wiadomość:",
        submission.message,
    ].filter((line): line is string => line !== null).join("\n");
}

function getResendErrorMessage(error: ErrorResponse) {
    if (
        error.name === "missing_api_key" ||
        error.name === "invalid_api_key" ||
        error.name === "restricted_api_key"
    ) {
        return "Sprawdź lokalną konfigurację RESEND_API_KEY.";
    }

    if (error.name === "invalid_from_address") {
        return "Resend odrzucił adres nadawcy. Sprawdź RESEND_FROM_EMAIL.";
    }

    if (
        error.name === "daily_quota_exceeded" ||
        error.name === "monthly_quota_exceeded" ||
        error.name === "rate_limit_exceeded"
    ) {
        return "Limit wysyłki Resend został osiągnięty. Spróbuj ponownie później.";
    }

    return "Resend odrzucił wiadomość. Sprawdź konfigurację nadawcy i odbiorcy.";
}

export async function sendContactMessageAction(
    input: ContactSubmission,
) {
    const parsed = contactSubmissionSchema.safeParse(input);

    if (!parsed.success) {
        return {
            success: false,
            error: "Sprawdź poprawność formularza.",
        };
    }

    const submission = parsed.data;
    const now = Date.now();

    if (
        now - submission.formStartedAt < 3_000 ||
        now - submission.formStartedAt > 2 * 60 * 60 * 1_000
    ) {
        return {
            success: false,
            error: "Spróbuj wypełnić formularz ponownie.",
        };
    }

    if (submission.honeypot) {
        return {success: true};
    }

    let config: ReturnType<typeof getContactConfig>;

    try {
        config = getContactConfig();
    } catch {
        return {
            success: false,
            error: "Brakuje lokalnej konfiguracji formularza kontaktowego.",
        };
    }

    try {
        const requestHeaders = await headers();
        const clientIp = getClientIp(requestHeaders);
        const rateLimitKey = createHmac("sha256", config.rateLimitSecret)
            .update(clientIp)
            .digest("hex");
        const rateLimit = await fetchMutation(
            api.contactRateLimits.consume,
            {
                key: rateLimitKey,
                now,
                rateLimitSecret: config.rateLimitSecret,
            },
        );

        if (rateLimit.allowed === false) {
            return {
                success: false,
                error: formatRetryAfter(rateLimit.retryAfterSeconds),
            };
        }

        const resend = new Resend(config.apiKey);
        const {error} = await resend.emails.send({
            from: config.from,
            to: [config.recipient],
            replyTo: submission.email || undefined,
            subject: getContactSubject(submission),
            text: getContactText(submission),
        });

        if (error) {
            console.error("Wysyłka formularza kontaktowego nie powiodła się.", {
                code: error.name,
                statusCode: error.statusCode,
            });
            return {
                success: false,
                error: getResendErrorMessage(error),
            };
        }

        return {success: true};
    } catch {
        return {
            success: false,
            error: "Nie udało się wysłać wiadomości. Spróbuj ponownie później.",
        };
    }
}

type GetNextForReviewArgs = Omit<
    FunctionArgs<typeof api.recipeImports.getNextForReview>,
    "adminSecret"
>;

export async function getNextForReviewAction(
    args: GetNextForReviewArgs,
) {
    await requireAdminRequest();

    return await fetchQuery(
        api.recipeImports.getNextForReview,
        {
            ...args,
            adminSecret: getAdminSecret(),
        },
    );
}

type PostponeImportArgs = Omit<
    FunctionArgs<typeof api.recipeImports.postpone>,
    "adminSecret"
>;

export async function postponeImportAction(
    args: PostponeImportArgs,
) {
    await requireAdminRequest();

    await fetchMutation(
        api.recipeImports.postpone,
        {
            ...args,
            adminSecret: getAdminSecret(),
        },
    );
}

type ApproveImportArgs = Omit<
    FunctionArgs<typeof api.recipeImports.approve>,
    "adminSecret"
>;

export async function approveImportAction(
    args: ApproveImportArgs,
) {
    await requireAdminRequest();

    return await fetchAction(
        api.recipeImports.approve,
        {
            ...args,
            adminSecret: getAdminSecret(),
        },
    );
}

type AddSubstituteArgs = Omit<
    FunctionArgs<typeof api.recipeImports.addSubstitute>,
    "adminSecret"
>;

export async function addSubstituteAction(
    args: AddSubstituteArgs,
) {
    await requireAdminRequest();

    return await fetchMutation(
        api.recipeImports.addSubstitute,
        {
            ...args,
            adminSecret: getAdminSecret(),
        },
    );
}

type RemoveImportIngredientArgs = Omit<
    FunctionArgs<typeof api.recipeImports.removeIngredient>,
    "adminSecret"
>;

export async function removeImportIngredientAction(
    args: RemoveImportIngredientArgs,
) {
    await requireAdminRequest();

    await fetchMutation(
        api.recipeImports.removeIngredient,
        {
            ...args,
            adminSecret: getAdminSecret(),
        },
    );
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
