"use client";

import {useEffect, useRef, useState, type ReactNode} from "react";
import {FormProvider, useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {useMutation, useQuery} from "convex/react";
import {useRouter} from "next/navigation";
import Image from "next/image";
import {ArrowLeft, Clock, Loader2, Pencil, Save, Users, X} from "lucide-react";
import {toast} from "sonner";
import {api} from "@gotujto/convex/_generated/api";
import {type Id} from "@gotujto/convex/_generated/dataModel";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {ToggleGroup, ToggleGroupItem} from "@/components/ui/toggle-group";
import InputController from "@/components/controllers/InputController";
import NumberInputController from "@/components/controllers/NumberInputController";
import ComboboxController from "@/components/controllers/ComboboxController";
import Step2 from "@/components/web/recipe-form/Step2";
import Step3 from "@/components/web/recipe-form/Step3";
import RecipeMediaFields from "@/components/web/recipe-form/RecipeMediaFields";
import {dietTypes, mealTypes, occasions} from "@gotujto/shared/data/stableData";
import {recipeFormSchema, type RecipeFormValues} from "@/lib/schemas/recipe";
import {uploadImages} from "@/lib/cloud/uploadImages";
import {uploadVideo} from "@/lib/cloud/uploadVideo";

type RecipeEditorProps = {
    mode: "create" | "edit";
    recipeId?: Id<"recipes">;
};

const emptyValues: RecipeFormValues = {
    step1: {
        name: "",
        cookingMinutes: 30,
        servings: 2,
        images: [],
        video: undefined,
        diets: [],
        types: [],
        occasions: [],
        description: "",
    },
    step2: [],
    step3: [{description: ""}],
};

export default function RecipeEditor({mode, recipeId}: RecipeEditorProps) {
    const router = useRouter();
    const [editedSection, setEditedSection] = useState<"media" | "details" | "ingredients" | "steps" | null>(null);
    const [unitSystem, setUnitSystem] = useState<"metric" | "customary">("metric");
    const initializedRecipeRef = useRef<Id<"recipes"> | null>(null);
    const createRecipe = useMutation(api.recipes.createRecipe);
    const updateRecipe = useMutation(api.recipes.updateRecipe);
    const editData = useQuery(
        api.recipes.getRecipeForEditing,
        mode === "edit" && recipeId ? {recipeId} : "skip",
    );

    const form = useForm<RecipeFormValues>({
        resolver: zodResolver(recipeFormSchema),
        defaultValues: emptyValues,
    });

    useEffect(() => {
        if (!recipeId || !editData || initializedRecipeRef.current === recipeId) {
            return;
        }

        form.reset(editData);
        initializedRecipeRef.current = recipeId;
    }, [editData, form, recipeId]);

    async function onSubmit(values: RecipeFormValues) {
        try {
            const imageIds = await Promise.all(
                values.step1.images.map(async image => {
                    if ("storageId" in image) {
                        return image.storageId;
                    }

                    const [imageId] = await uploadImages([{
                        id: image.id,
                        file: image.file,
                        previewUrl: image.previewUrl,
                    }]);

                    if (!imageId) {
                        throw new Error("Serwer nie zwrócił identyfikatora zdjęcia");
                    }

                    return imageId;
                }),
            );

            const videoKey = values.step1.video
                ? "file" in values.step1.video
                    ? await uploadVideo(values.step1.video.file)
                    : values.step1.video.videoKey
                : undefined;

            const {images, video, ...recipeFields} = values.step1;
            const step2 = values.step2.map(group => ({
                main: withoutProductName(group.main),
                substitutes: group.substitutes.map(withoutProductName),
            }));
            const payload = {
                step1: {...recipeFields, images: imageIds, videoKey},
                step2,
                step3: values.step3.map(({description}) => ({description})),
            };

            const savedRecipeId = mode === "edit" && recipeId
                ? await updateRecipe({recipeId, ...payload})
                : await createRecipe(payload);

            toast.success(mode === "edit" ? "Zmiany zostały zapisane" : "Przepis został dodany");
            router.push(`/recipe/${savedRecipeId}`);
        } catch (error) {
            console.error("RecipeEditor:", error);
            toast.error("Nie udało się zapisać przepisu");
        }
    }

    if (mode === "edit" && editData === undefined) {
        return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="size-7 animate-spin" /></div>;
    }

    if (mode === "edit" && editData === null) {
        return <div className="p-8 text-center">Nie znaleziono przepisu.</div>;
    }

    const values = form.watch();
    const images = values.step1.images.map(image => image.previewUrl);
    const videoUrl = values.step1.video?.previewUrl;

    return (
        <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <article className="mx-auto min-h-screen w-full max-w-3xl bg-background pb-28">
                    <div className="sticky top-0 z-40 flex items-center justify-between border-b bg-background/90 px-4 py-3 backdrop-blur">
                        <Button type="button" size="icon" variant="ghost" onClick={() => router.back()} aria-label="Wróć"><ArrowLeft className="size-5" /></Button>
                        <span className="text-sm font-medium">{mode === "edit" ? "Edycja przepisu" : "Nowy przepis"}</span>
                        <Button type="submit" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                            Zapisz
                        </Button>
                    </div>

                    <div className="relative">
                        {images.length > 0 || videoUrl ? (
                            <EditorMediaHeader title={values.step1.name || "Nowy przepis"} images={images} videoUrl={videoUrl} />
                        ) : (
                            <div className="flex aspect-[4/5] items-center justify-center bg-muted text-center text-sm text-muted-foreground">Dodaj zdjęcie przepisu</div>
                        )}
                        <EditButton label="Edytuj media" className="absolute right-4 top-4" onClick={() => setEditedSection("media")} />
                    </div>

                    <div className="space-y-12 px-5 py-8 sm:px-8">
                        <section className="relative space-y-5">
                            <EditButton label="Edytuj informacje" className="absolute right-0 top-0" onClick={() => setEditedSection("details")} />
                            <h1 className="pr-12 text-2xl font-bold tracking-tight">{values.step1.name || "Nazwa przepisu"}</h1>
                            <div className="flex flex-wrap items-center gap-5 text-sm">
                                <span className="flex items-center gap-2"><Clock className="size-5" />{values.step1.cookingMinutes} min</span>
                                <span className="flex items-center gap-2"><Users className="size-5" />{values.step1.servings} porcji</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {[...values.step1.diets, ...values.step1.types, ...values.step1.occasions].map((value, index) => <span key={`${value}-${index}`} className="rounded-full bg-muted px-3 py-1 text-xs">{value}</span>)}
                            </div>
                            {values.step1.description && (
                                <p className="whitespace-pre-line leading-7 text-muted-foreground">
                                    {values.step1.description}
                                </p>
                            )}
                        </section>

                        <section className="space-y-5">
                            <div className="flex items-end justify-between gap-4">
                                <div><p className="text-sm text-muted-foreground">{values.step2.length} składników</p><h2 className="text-2xl font-bold">Składniki</h2></div>
                                <div className="flex items-center gap-2">
                                    <ToggleGroup type="single" value={unitSystem} onValueChange={value => value && setUnitSystem(value as "metric" | "customary")} variant="outline" size="sm">
                                        <ToggleGroupItem value="metric" aria-label="Jednostki metryczne">Metryczne</ToggleGroupItem>
                                        <ToggleGroupItem value="customary" aria-label="Jednostki użytkowe">Użytkowe</ToggleGroupItem>
                                    </ToggleGroup>
                                    <EditButton label="Edytuj składniki" onClick={() => setEditedSection("ingredients")} />
                                </div>
                            </div>
                            <Card className="overflow-hidden py-0"><CardContent className="divide-y p-0">
                                {values.step2.length === 0 ? <p className="p-5 text-sm text-muted-foreground">Dodaj pierwszy składnik.</p> : values.step2.map((group, index) => {
                                    const ingredient = group.main;
                                    const quantity = unitSystem === "metric" ? ingredient.metricQuantity : ingredient.customaryQuantity;
                                    const unit = unitSystem === "metric" ? ingredient.metricUnit : ingredient.customaryUnit;
                                    return <div key={index} className="flex min-h-18 items-center gap-4 px-4 py-3 sm:px-5"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">{index + 1}</span><div className="min-w-0 flex-1"><p><strong>{quantity} {unit}</strong>{" "}{ingredient.productName || "Wybierz produkt"}</p>{group.substitutes.length > 0 && <p className="mt-1 text-xs text-muted-foreground">{group.substitutes.length} zamienników</p>}</div></div>;
                                })}
                            </CardContent></Card>
                        </section>

                        <section className="space-y-6">
                            <div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">{values.step3.length} kroków</p><h2 className="text-2xl font-bold">Przygotowanie</h2></div><EditButton label="Edytuj kroki" onClick={() => setEditedSection("steps")} /></div>
                            <ol className="space-y-5">{values.step3.map((step, index) => <li key={index} className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-4"><span className="flex size-10 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">{index + 1}</span><Card><CardContent className="p-5"><p className="leading-7 text-muted-foreground">{step.description || "Opisz ten krok"}</p></CardContent></Card></li>)}</ol>
                        </section>
                    </div>
                </article>

                <EditorDialog title={dialogTitle(editedSection)} open={editedSection !== null} onClose={() => setEditedSection(null)}>
                    {editedSection === "media" && <RecipeMediaFields />}
                    {editedSection === "details" && <BasicRecipeFields />}
                    {editedSection === "ingredients" && <Step2 />}
                    {editedSection === "steps" && <Step3 />}
                </EditorDialog>
            </form>
        </FormProvider>
    );
}

function BasicRecipeFields() {
    return <div className="space-y-6">
        <InputController name="step1.name" label="Nazwa przepisu" placeholder="Np. Spaghetti Carbonara" />
        <div className="grid grid-cols-2 gap-4"><NumberInputController name="step1.cookingMinutes" label="Czas przygotowania (min)" /><NumberInputController name="step1.servings" label="Liczba porcji" /></div>
        <ComboboxController name="step1.diets" label="Diety" items={dietTypes.map(key => ({key}))} />
        <ComboboxController name="step1.types" label="Typ posiłku" items={mealTypes.map(key => ({key}))} />
        <ComboboxController name="step1.occasions" label="Okazje" items={occasions.map(key => ({key}))} />
        <InputController name="step1.description" label="Opis przepisu" placeholder="Krótki opis przepisu"/>
    </div>;
}

function EditorMediaHeader({title, images, videoUrl}: {title: string; images: string[]; videoUrl?: string}) {
    return <header className="flex aspect-[4/5] w-full snap-x snap-mandatory overflow-x-auto bg-black [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {videoUrl && <video src={videoUrl} controls muted playsInline className="h-full min-w-full snap-center object-cover" />}
        {images.map((src, index) => <div key={`${src}-${index}`} className="relative h-full min-w-full snap-center"><Image src={src} alt={`${title} — zdjęcie ${index + 1}`} fill sizes="(max-width: 768px) 100vw, 768px" unoptimized={src.startsWith("blob:")} className="object-cover" /></div>)}
    </header>;
}

function EditButton({label, className = "", onClick}: {label: string; className?: string; onClick: () => void}) {
    return <Button type="button" size="icon" variant="secondary" className={`rounded-full shadow-md ${className}`} onClick={onClick} aria-label={label}><Pencil className="size-4" /></Button>;
}

function EditorDialog({title, open, onClose, children}: {title: string; open: boolean; onClose: () => void; children: ReactNode}) {
    if (!open) return null;
    return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
        <div className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-background p-5 shadow-xl sm:rounded-2xl sm:p-7">
            <div className="mb-6 flex items-center justify-between"><h2 className="text-xl font-bold">{title}</h2><Button type="button" size="icon" variant="ghost" onClick={onClose} aria-label="Zamknij"><X className="size-5" /></Button></div>
            {children}
            <div className="mt-8 flex justify-end"><Button type="button" onClick={onClose}>Gotowe</Button></div>
        </div>
    </div>;
}

function dialogTitle(section: "media" | "details" | "ingredients" | "steps" | null) {
    if (section === "media") return "Zdjęcia i film";
    if (section === "details") return "Informacje o przepisie";
    if (section === "ingredients") return "Składniki i zamienniki";
    if (section === "steps") return "Przygotowanie";
    return "Edycja";
}

function withoutProductName<T extends {productName?: string}>(ingredient: T): Omit<T, "productName"> {
    const {productName: _productName, ...value} = ingredient;
    return value;
}
