"use client";

import {useEffect, useState, type ReactNode} from "react";
import {useAction, useMutation, useQuery} from "convex/react";
import {type FunctionReturnType} from "convex/server";
import {AlertCircle, Check, ChevronDown, Clock, LoaderCircle, Plus, Save, Search, Trash2, Users} from "lucide-react";
import {toast} from "sonner";
import {api} from "@gotujto/convex/_generated/api";
import {type Doc, type Id} from "@gotujto/convex/_generated/dataModel";
import {customaryUnits, dietTypes, mealTypes, metricUnits, occasions} from "@gotujto/shared/data/stableData";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";

type ReviewStatus = "raw" | "postponed" | "error";
type ImportResult = NonNullable<FunctionReturnType<typeof api.recipeImports.getNextForReview>>;
type ImportIngredient = ImportResult["ingredients"][number];
type ImportStep = ImportResult["steps"][number];

const statuses: Array<{value: ReviewStatus; label: string}> = [
    {value: "raw", label: "Nowe"},
    {value: "postponed", label: "Odłożone"},
    {value: "error", label: "Błędy"},
];

export default function RecipeImportsPage() {
    const [status, setStatus] = useState<ReviewStatus>("raw");
    const [excludedIds, setExcludedIds] = useState<Id<"recipeImports">[]>([]);
    const [draft, setDraft] = useState<ImportResult | null>(null);
    const [pendingAction, setPendingAction] = useState<"save" | "postpone" | "approve" | null>(null);

    const result = useQuery(api.recipeImports.getNextForReview, {status, excludedIds});
    const saveDraft = useMutation(api.recipeImports.saveDraft);
    const postponeImport = useMutation(api.recipeImports.postpone);
    const approveImport = useAction(api.recipeImports.approve);
    const addSubstitute = useMutation(api.recipeImports.addSubstitute);
    const removeIngredient = useMutation(api.recipeImports.removeIngredient);

    useEffect(() => {
        if (result) {
            setDraft(structuredClone(result));
        } else if (result === null) {
            setDraft(null);
        }
    }, [result]);

    function selectStatus(nextStatus: ReviewStatus) {
        setStatus(nextStatus);
        setExcludedIds([]);
        setDraft(null);
    }

    function skipCurrent() {
        if (!draft) return;
        setExcludedIds(current => [...current, draft.recipe._id]);
        setDraft(null);
    }

    async function persistDraft() {
        if (!draft) return;

        await saveDraft({
            recipeImportId: draft.recipe._id,
            recipe: {
                name: draft.recipe.name,
                description: draft.recipe.description,
                cookingMinutes: draft.recipe.cookingMinutes,
                servings: draft.recipe.servings,
                authorName: draft.recipe.authorName,
                diets: draft.recipe.diets,
                types: draft.recipe.types,
                occasions: draft.recipe.occasions,
            },
            ingredients: draft.ingredients.map(ingredient => ({
                ingredientImportId: ingredient._id,
                translatedProductName: ingredient.translatedProductName,
                productId: ingredient.productId,
                substitutionGroup: ingredient.substitutionGroup,
                groupLevel: ingredient.groupLevel,
                metricUnit: ingredient.metricUnit,
                metricQuantity: ingredient.metricQuantity,
                customaryUnit: ingredient.customaryUnit,
                customaryQuantity: ingredient.customaryQuantity,
                optional: ingredient.optional,
            })),
            steps: draft.steps.map(step => ({
                stepImportId: step._id,
                stepNum: step.stepNum,
                description: step.description,
            })),
        });
    }

    async function handleSave() {
        try {
            setPendingAction("save");
            await persistDraft();
            toast.success("Zapisano zmiany");
        } catch (error) {
            console.error("save import:", error);
            toast.error("Nie udało się zapisać zmian");
        } finally {
            setPendingAction(null);
        }
    }

    async function handlePostpone() {
        if (!draft) return;

        try {
            setPendingAction("postpone");
            await persistDraft();
            await postponeImport({recipeImportId: draft.recipe._id});
            skipCurrent();
            toast.success("Przepis odłożono na później");
        } catch (error) {
            console.error("postpone import:", error);
            toast.error("Nie udało się odłożyć przepisu");
        } finally {
            setPendingAction(null);
        }
    }

    async function handleApprove() {
        if (!draft) return;

        try {
            setPendingAction("approve");
            await persistDraft();
            await approveImport({recipeImportId: draft.recipe._id});
            skipCurrent();
            toast.success("Przepis został opublikowany");
        } catch (error) {
            console.error("approve import:", error);

            toast.error(
                error instanceof Error
                    ? error.message
                    : "Nie udało się opublikować przepisu",
            );
        } finally {
            setPendingAction(null);
        }
    }

    async function handleAddSubstitute(group: number) {
        if (!draft) return;

        try {
            setPendingAction("save");
            await persistDraft();
            await addSubstitute({
                recipeImportId: draft.recipe._id,
                substitutionGroup: group,
            });
            toast.success("Dodano zamiennik");
        } catch (error) {
            console.error("add substitute:", error);
            toast.error("Nie udało się dodać zamiennika");
        } finally {
            setPendingAction(null);
        }
    }

    async function handleRemoveIngredient(ingredientId: Id<"ingredientsImports">) {
        try {
            setPendingAction("save");
            await removeIngredient({ingredientImportId: ingredientId});
            toast.success("Usunięto zamiennik");
        } catch (error) {
            console.error("remove ingredient:", error);
            toast.error("Nie udało się usunąć zamiennika");
        } finally {
            setPendingAction(null);
        }
    }

    if (result === undefined || (!draft && result !== null)) {
        return <div className="flex min-h-[60vh] items-center justify-center"><LoaderCircle className="size-8 animate-spin" /></div>;
    }

    return (
        <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-8">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm text-muted-foreground">TheMealDB</p>
                    <h1 className="text-3xl font-bold">Weryfikacja importów</h1>
                </div>

                <div className="flex gap-2">
                    {statuses.map(item => (
                        <Button key={item.value} type="button" variant={status === item.value ? "default" : "outline"} onClick={() => selectStatus(item.value)}>
                            {item.label}
                        </Button>
                    ))}
                </div>
            </header>

            {!draft ? (
                <Card><CardContent className="py-16 text-center text-muted-foreground">Brak przepisów ze statusem „{status}”.</CardContent></Card>
            ) : (
                <>
                    {draft.recipe.error && (
                        <div className="flex gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                            <AlertCircle className="size-5 shrink-0" />
                            <span>{draft.recipe.error}</span>
                        </div>
                    )}

                    <article className="mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border bg-background">
                        {draft.recipe.imageUrl ? (
                            <img src={draft.recipe.imageUrl} alt={draft.recipe.name ?? draft.recipe.originalName} className="aspect-[4/5] w-full object-cover" />
                        ) : (
                            <div className="flex aspect-[4/5] items-center justify-center bg-muted text-muted-foreground">Brak zdjęcia</div>
                        )}

                        <div className="space-y-10 px-5 py-8 sm:px-8">
                            <section className="space-y-5">
                                <Field label="Nazwa"><Input value={draft.recipe.name ?? ""} onChange={event => setDraft({...draft, recipe: {...draft.recipe, name: event.target.value}})} /></Field>
                                <Field label="Opis"><Textarea rows={4} value={draft.recipe.description ?? ""} onChange={event => setDraft({...draft, recipe: {...draft.recipe, description: event.target.value || null}})} /></Field>

                                <div className="grid gap-4 sm:grid-cols-3">
                                    <Field label="Czas przygotowania"><NumberField icon={<Clock className="size-4" />} value={draft.recipe.cookingMinutes} onChange={value => setDraft({...draft, recipe: {...draft.recipe, cookingMinutes: value}})} /></Field>
                                    <Field label="Liczba porcji"><NumberField icon={<Users className="size-4" />} value={draft.recipe.servings} onChange={value => setDraft({...draft, recipe: {...draft.recipe, servings: value}})} /></Field>
                                    <Field label="Autor"><Input value={draft.recipe.authorName} onChange={event => setDraft({...draft, recipe: {...draft.recipe, authorName: event.target.value}})} /></Field>
                                </div>

                                <OptionButtons label="Diety" options={dietTypes} selected={draft.recipe.diets} onChange={diets => setDraft({...draft, recipe: {...draft.recipe, diets}})} />
                                <OptionButtons label="Typy posiłku" options={mealTypes} selected={draft.recipe.types} onChange={types => setDraft({...draft, recipe: {...draft.recipe, types}})} />
                                <OptionButtons label="Okazje" options={occasions} selected={draft.recipe.occasions} onChange={nextOccasions => setDraft({...draft, recipe: {...draft.recipe, occasions: nextOccasions}})} />
                            </section>

                            <section className="space-y-4">
                                <div><p className="text-sm text-muted-foreground">{draft.ingredients.length} pozycji</p><h2 className="text-2xl font-bold">Składniki</h2></div>
                                {groupIngredients(draft.ingredients).map(group => (
                                    <IngredientGroup
                                        key={group.group}
                                        group={group}
                                        disabled={pendingAction !== null}
                                        onIngredientChange={nextIngredient => setDraft({
                                            ...draft,
                                            ingredients: draft.ingredients.map(item =>
                                                item._id === nextIngredient._id ? nextIngredient : item,
                                            ),
                                        })}
                                        onAddSubstitute={() => handleAddSubstitute(group.group)}
                                        onRemoveIngredient={handleRemoveIngredient}
                                    />
                                ))}
                            </section>

                            <section className="space-y-4">
                                <div><p className="text-sm text-muted-foreground">{draft.steps.length} kroków</p><h2 className="text-2xl font-bold">Przygotowanie</h2></div>
                                {draft.steps.map((step, index) => (
                                    <StepCard key={step._id} step={step} index={index} onChange={nextStep => setDraft({...draft, steps: draft.steps.map((item, itemIndex) => itemIndex === index ? nextStep : item)})} />
                                ))}
                            </section>
                        </div>
                    </article>

                    <footer className="sticky bottom-4 z-20 mx-auto flex max-w-3xl flex-wrap justify-end gap-3 rounded-2xl border bg-background/95 p-4 shadow-xl backdrop-blur">
                        <Button type="button" variant="ghost" onClick={skipCurrent} disabled={pendingAction !== null}>Pomiń</Button>
                        <Button type="button" variant="outline" onClick={handleSave} disabled={pendingAction !== null}>{pendingAction === "save" ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}Zapisz</Button>
                        <Button type="button" variant="secondary" onClick={handlePostpone} disabled={pendingAction !== null}>{pendingAction === "postpone" && <LoaderCircle className="size-4 animate-spin" />}Odłóż</Button>
                        <Button type="button" onClick={handleApprove} disabled={pendingAction !== null}>{pendingAction === "approve" ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}Zatwierdź i opublikuj</Button>
                    </footer>
                </>
            )}
        </main>
    );
}

type IngredientGroupData = {
    group: number;
    ingredients: ImportIngredient[];
};

function IngredientGroup({group, disabled, onIngredientChange, onAddSubstitute, onRemoveIngredient}: {
    group: IngredientGroupData;
    disabled: boolean;
    onIngredientChange: (ingredient: ImportIngredient) => void;
    onAddSubstitute: () => void;
    onRemoveIngredient: (ingredientId: Id<"ingredientsImports">) => void;
}) {
    const [open, setOpen] = useState(true);
    const mainIngredient = group.ingredients[0];

    return (
        <Card>
            <CardHeader className="p-0">
                <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                    onClick={() => setOpen(current => !current)}
                    aria-expanded={open}
                >
                    <div className="min-w-0">
                        <span className="block text-xs text-muted-foreground">
                            Składnik {group.group}
                        </span>
                        <CardTitle className="truncate text-base">
                            {mainIngredient.translatedProductName || mainIngredient.sourceIngredient}
                        </CardTitle>
                    </div>

                    <ChevronDown
                        className={`size-5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
                    />
                </button>
            </CardHeader>

            {open && (
                <CardContent className="space-y-4">
                    <IngredientCard
                        ingredient={mainIngredient}
                        label="Główny składnik"
                        canRemove={false}
                        disabled={disabled}
                        onChange={onIngredientChange}
                        onRemove={() => undefined}
                    />

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={disabled}
                        onClick={onAddSubstitute}
                    >
                        <Plus className="size-4" />
                        Dodaj zamiennik
                    </Button>

                    {group.ingredients.length > 1 && (
                        <div className="space-y-3 border-t pt-4">
                            <p className="text-sm font-semibold">
                                Zamienniki
                            </p>

                            {group.ingredients.slice(1).map((ingredient, index) => (
                                <IngredientCard
                                    key={ingredient._id}
                                    ingredient={ingredient}
                                    label={`Zamiennik ${index + 1}`}
                                    canRemove={true}
                                    disabled={disabled}
                                    onChange={onIngredientChange}
                                    onRemove={() => onRemoveIngredient(ingredient._id)}
                                />
                            ))}
                        </div>
                    )}
                </CardContent>
            )}
        </Card>
    );
}

function IngredientCard({ingredient, label, canRemove, disabled, onChange, onRemove}: {
    ingredient: ImportIngredient;
    label: string;
    canRemove: boolean;
    disabled: boolean;
    onChange: (ingredient: ImportIngredient) => void;
    onRemove: () => void;
}) {
    return (
        <div className="space-y-4 rounded-xl border p-4">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="font-semibold">{label}</p>
                    {ingredient.sourceIngredient && <p className="text-xs text-muted-foreground">Źródło: {ingredient.sourceIngredient} — {ingredient.sourceMeasure}</p>}
                </div>
                {canRemove && (
                    <Button type="button" variant="ghost" size="icon" disabled={disabled} onClick={onRemove} aria-label="Usuń zamiennik">
                        <Trash2 className="size-4" />
                    </Button>
                )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <ProductPicker ingredient={ingredient} onChange={onChange} />
                <Field label="Oryginalna miara"><Input value={ingredient.sourceMeasure} disabled /></Field>
                <Field label="Ilość metryczna"><NumberField value={ingredient.metricQuantity} onChange={value => onChange({...ingredient, metricQuantity: value})} /></Field>
                <Field label="Jednostka metryczna"><select className="h-9 rounded-md border bg-background px-3 text-sm" value={ingredient.metricUnit ?? ""} onChange={event => onChange({...ingredient, metricUnit: (event.target.value || null) as ImportIngredient["metricUnit"]})}><option value="">Wybierz</option>{metricUnits.map(unit => <option key={unit} value={unit}>{unit}</option>)}</select></Field>
                <Field label="Ilość użytkowa"><NumberField value={ingredient.customaryQuantity} onChange={value => onChange({...ingredient, customaryQuantity: value})} /></Field>
                <Field label="Jednostka użytkowa"><select className="h-9 rounded-md border bg-background px-3 text-sm" value={ingredient.customaryUnit ?? ""} onChange={event => onChange({...ingredient, customaryUnit: (event.target.value || null) as ImportIngredient["customaryUnit"]})}><option value="">Wybierz</option>{customaryUnits.map(unit => <option key={unit} value={unit}>{unit}</option>)}</select></Field>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={ingredient.optional} onChange={event => onChange({...ingredient, optional: event.target.checked})} />Opcjonalny</label>
            </div>
        </div>
    );
}

function ProductPicker({ingredient, onChange}: {ingredient: ImportIngredient; onChange: (ingredient: ImportIngredient) => void}) {
    const [phrase, setPhrase] = useState(ingredient.translatedProductName ?? "");
    const [open, setOpen] = useState(false);
    const products = useQuery(api.products.searchProducts, phrase.trim().length >= 2 && open ? {phrase} : "skip");

    function selectProduct(product: Doc<"products">) {
        setPhrase(product.name);
        setOpen(false);
        onChange({...ingredient, productId: product._id, translatedProductName: product.name});
    }

    return (
        <Field label="Produkt">
            <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={phrase} className="pl-9" onFocus={() => setOpen(true)} onChange={event => {setPhrase(event.target.value); setOpen(true); onChange({...ingredient, productId: null, translatedProductName: event.target.value || null});}} />
                {open && phrase.trim().length >= 2 && (
                    <div className="absolute inset-x-0 top-full z-30 mt-1 max-h-52 overflow-y-auto rounded-md border bg-popover p-1 shadow-xl">
                        {products === undefined && <p className="px-3 py-2 text-sm text-muted-foreground">Wyszukiwanie…</p>}
                        {products?.length === 0 && <p className="px-3 py-2 text-sm text-muted-foreground">Nie znaleziono produktu.</p>}
                        {products?.map(product => <button key={product._id} type="button" className="block w-full rounded-sm px-3 py-2 text-left text-sm hover:bg-accent" onMouseDown={event => event.preventDefault()} onClick={() => selectProduct(product)}>{product.name}</button>)}
                    </div>
                )}
            </div>
            {ingredient.productId === null && (
                <p className="text-sm font-medium text-destructive">
                    Nie przypisano produktu:{" "}
                    {ingredient.translatedProductName ||
                        ingredient.sourceIngredient}
                </p>
            )}
        </Field>
    );
}

function StepCard({step, index, onChange}: {step: ImportStep; index: number; onChange: (step: ImportStep) => void}) {
    return <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-4"><span className="flex size-10 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">{index + 1}</span><Textarea rows={5} value={step.description ?? ""} onChange={event => onChange({...step, description: event.target.value || null})} /></div>;
}

function OptionButtons<T extends string>({label, options, selected, onChange}: {label: string; options: readonly T[]; selected: T[]; onChange: (selected: T[]) => void}) {
    return <fieldset className="space-y-2"><legend className="text-sm font-medium">{label}</legend><div className="flex flex-wrap gap-2">{options.map(option => {const active = selected.includes(option); return <Button key={option} type="button" size="sm" variant={active ? "default" : "outline"} onClick={() => onChange(active ? selected.filter(item => item !== option) : [...selected, option])}>{option}</Button>;})}</div></fieldset>;
}

function Field({label, children}: {label: string; children: ReactNode}) {
    return <label className="grid gap-2 text-sm font-medium"><span>{label}</span>{children}</label>;
}

function NumberField({value, onChange, icon}: {value: number | null; onChange: (value: number | null) => void; icon?: ReactNode}) {
    return <div className="relative">{icon && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>}<Input type="number" min="0" step="any" value={value ?? ""} className={icon ? "pl-9" : undefined} onChange={event => onChange(event.target.value === "" ? null : Number(event.target.value))} /></div>;
}

function groupIngredients(ingredients: ImportIngredient[]): IngredientGroupData[] {
    const groups = new Map<number, ImportIngredient[]>();

    ingredients.forEach(ingredient => {
        const group = groups.get(ingredient.substitutionGroup) ?? [];
        group.push(ingredient);
        groups.set(ingredient.substitutionGroup, group);
    });

    return [...groups.entries()]
        .sort(([first], [second]) => first - second)
        .map(([group, groupIngredients]) => ({
            group,
            ingredients: [...groupIngredients].sort((first, second) => first.groupLevel - second.groupLevel),
        }));
}