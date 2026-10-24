import {type ReactNode, useMemo, useState} from "react";
import {ActivityIndicator, Keyboard, Modal, Pressable, ScrollView, TextInput, View} from "react-native";
import {Check, ChefHat, ChevronDown, Plus, Search, Send, Trash2, X} from "lucide-react-native";
import {useMutation, useQuery} from "convex/react";

import {api} from "@gotujto/convex/_generated/api";
import {type Doc} from "@gotujto/convex/_generated/dataModel";
import {customaryUnits, metricUnits} from "@gotujto/shared/data/stableData";
import {Text} from "@/components/ui/text";
import {SubmissionImagePicker} from "@/components/Submission/SubmissionImagePicker";
import {SubmissionVideoPicker} from "@/components/Submission/SubmissionVideoPicker";
import {type SubmissionImageAsset, uploadSubmissionImages} from "@/lib/submissions/uploadImages";
import {type SubmissionVideoAsset, uploadSubmissionVideo} from "@/lib/submissions/uploadVideo";
import {useToast} from "@/components/ui/toast";

type IngredientDraft = {
    id: string;
    product: Doc<"products">;
    metricQuantity: string;
    metricUnit: typeof metricUnits[number];
    customaryQuantity: string;
    customaryUnit: typeof customaryUnits[number];
};

function parseQuantity(value: string) {
    return Number(value.trim().replace(",", "."));
}

function submissionErrorMessage(error: unknown) {
    if (typeof error === "object" && error !== null && "data" in error) {
        const data = error.data;
        if (typeof data === "object" && data !== null && "code" in data) {
            if (data.code === "SUBMISSION_LIMIT_REACHED") return "Możesz mieć maksymalnie 10 przepisów oczekujących na weryfikację.";
            if (data.code === "PRODUCT_NOT_FOUND") return "Wybrany produkt nie jest już dostępny. Usuń go z przepisu i wybierz inny.";
            if (data.code === "INVALID_IMAGE") return "Nie udało się zweryfikować zdjęć. Wybierz je i wyślij ponownie.";
            if (data.code === "INVALID_VIDEO") return "Nie udało się zweryfikować filmu. Wybierz go i wyślij ponownie.";
            if (data.code === "INVALID_INPUT" && "message" in data && typeof data.message === "string") return data.message;
        }
    }
    return "Nie udało się wysłać przepisu. Spróbuj ponownie.";
}

export function RecipeSubmissionForm({onComplete}: {onComplete: () => void}) {
    const {toast} = useToast();
    const createSubmission = useMutation(api.userDashboard.createRecipeSubmission);
    const generateUploadUrl = useMutation(api.userDashboard.generateRecipeSubmissionImageUploadUrl);
    const registerUpload = useMutation(api.userDashboard.registerPendingSubmissionImage);
    const registerVideoUpload = useMutation(api.userDashboard.registerPendingSubmissionVideo);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [cookingMinutes, setCookingMinutes] = useState("30");
    const [servings, setServings] = useState("2");
    const [images, setImages] = useState<SubmissionImageAsset[]>([]);
    const [video, setVideo] = useState<SubmissionVideoAsset>();
    const [ingredients, setIngredients] = useState<IngredientDraft[]>([]);
    const [steps, setSteps] = useState([""]);
    const [productPhrase, setProductPhrase] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionError, setSubmissionError] = useState<string | null>(null);
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const portions = Number(servings.trim());
    const invalidServings = !servings.trim() || !Number.isInteger(portions) || portions < 1 || portions > 100;
    const showServingsError = invalidServings && (hasSubmitted || servings.trim().length > 0);
    const productResults = useQuery(api.products.searchProducts, productPhrase.trim().length >= 2 ? {phrase: productPhrase.trim()} : "skip");
    const suggestions = useMemo(() => productResults?.filter(product => !ingredients.some(ingredient => ingredient.product._id === product._id)), [ingredients, productResults]);

    function addIngredient(product: Doc<"products">) {
        Keyboard.dismiss();
        setIngredients(current => [...current, {
            id: `${product._id}-${Date.now()}`,
            product,
            metricQuantity: "100",
            metricUnit: "g",
            customaryQuantity: "1",
            customaryUnit: "szt",
        }]);
        setProductPhrase("");
    }

    function updateIngredient(id: string, patch: Partial<IngredientDraft>) {
        setIngredients(current => current.map(ingredient => ingredient.id === id ? {...ingredient, ...patch} : ingredient));
    }

    async function handleSubmit() {
        setHasSubmitted(true);
        setSubmissionError(null);
        const minutes = Number(cookingMinutes);

        if (invalidServings) {
            const message = "Liczba porcji musi być liczbą całkowitą od 1 do 100.";
            setSubmissionError(message);
            toast({title: message, variant: "destructive"});
            return;
        }

        if (!name.trim()) {
            toast({title: "Podaj nazwę przepisu.", variant: "destructive"});
            return;
        }
        if (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440) {
            toast({title: "Czas przygotowania musi wynosić od 1 do 1440 minut.", variant: "destructive"});
            return;
        }
        if (!images.length) {
            toast({title: "Dodaj co najmniej jedno zdjęcie przepisu.", variant: "destructive"});
            return;
        }
        if (!ingredients.length) {
            toast({title: "Dodaj co najmniej jeden składnik.", variant: "destructive"});
            return;
        }
        const invalidIngredient = ingredients.find(item =>
            !Number.isFinite(parseQuantity(item.metricQuantity)) || parseQuantity(item.metricQuantity) <= 0
            || !Number.isFinite(parseQuantity(item.customaryQuantity)) || parseQuantity(item.customaryQuantity) <= 0,
        );
        if (invalidIngredient) {
            toast({title: `Sprawdź ilości składnika: ${invalidIngredient.product.name}.`, variant: "destructive"});
            return;
        }
        const recipeSteps = steps.map(description => description.trim()).filter(Boolean);
        if (!recipeSteps.length) {
            toast({title: "Dodaj przynajmniej jeden krok przygotowania.", variant: "destructive"});
            return;
        }

        setIsSubmitting(true);
        setSubmissionError(null);
        let isSavingSubmission = false;
        try {
            const imageIds = await uploadSubmissionImages(images, generateUploadUrl, registerUpload);
            let videoKey: string | undefined;
            if (video) {
                try {
                    videoKey = await uploadSubmissionVideo(video, "recipe-submission", registerVideoUpload);
                } catch (error) {
                    throw new Error(error instanceof Error ? `Nie udało się przesłać filmu: ${error.message}` : "Nie udało się przesłać filmu.");
                }
            }
            isSavingSubmission = true;
            await createSubmission({
                recipe: {
                    name: name.trim(),
                    description: description.trim(),
                    cookingMinutes: minutes,
                    servings: portions,
                    images: imageIds,
                    ...(videoKey ? {videoKey} : {}),
                    diets: [],
                    types: [],
                    occasions: [],
                    ingredientGroups: ingredients.map(item => ({
                        main: {
                            productId: item.product._id,
                            metricUnit: item.metricUnit,
                            customaryUnit: item.customaryUnit,
                            metricQuantity: parseQuantity(item.metricQuantity),
                            customaryQuantity: parseQuantity(item.customaryQuantity),
                            optional: false,
                        },
                        substitutes: [],
                    })),
                    recipeSteps: recipeSteps.map(step => ({description: step})),
                },
            });
            toast({title: "Przepis został wysłany do weryfikacji.", variant: "success"});
            onComplete();
        } catch (error) {
            const message = isSavingSubmission
                ? submissionErrorMessage(error)
                : error instanceof Error ? error.message : "Nie udało się wysłać przepisu.";
            setSubmissionError(message);
            toast({title: message, variant: "destructive"});
        } finally {
            setIsSubmitting(false);
        }
    }

    return <ScrollView className="flex-1 bg-black" contentContainerStyle={{paddingBottom: 120}} keyboardShouldPersistTaps="always"><View className="px-5 pt-8"><View className="size-12 items-center justify-center rounded-2xl bg-lime-400/15"><ChefHat size={23} color="#a3e635" /></View><Text className="mt-5 text-2xl font-bold text-white">Dodaj przepis</Text><Text className="mt-2 text-sm leading-6 text-white/60">Uzupełnij pełne miary, składniki i kroki. Przepis zostanie sprawdzony przed publikacją.</Text><View className="mt-7 gap-6"><FormField label="Nazwa przepisu"><TextInput value={name} onChangeText={setName} maxLength={120} className="h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-base text-white" placeholder="Np. Makaron z warzywami" placeholderTextColor="rgba(255,255,255,0.4)" /></FormField><View className="flex-row gap-3"><View className="flex-1"><FormField label="Czas (min)"><TextInput value={cookingMinutes} onChangeText={setCookingMinutes} keyboardType="number-pad" className="h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-base text-white" /></FormField></View><View className="flex-1"><FormField label="Porcje"><TextInput value={servings} onChangeText={value => {setServings(value); setSubmissionError(null);}} keyboardType="number-pad" className="h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-base text-white" />{showServingsError && <Text accessibilityRole="alert" className="mt-1 text-xs leading-4 text-red-300">Liczba porcji musi być liczbą całkowitą od 1 do 100.</Text>}</FormField></View></View><FormField label="Opis"><TextInput value={description} onChangeText={setDescription} multiline textAlignVertical="top" maxLength={2_000} className="min-h-28 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-base text-white" placeholder="Krótko opisz danie…" placeholderTextColor="rgba(255,255,255,0.4)" /></FormField><SubmissionImagePicker images={images} maxImages={8} onChange={setImages} /><SubmissionVideoPicker video={video} onChange={setVideo} /><IngredientsEditor ingredients={ingredients} phrase={productPhrase} onPhraseChange={setProductPhrase} suggestions={suggestions} onAdd={addIngredient} onUpdate={updateIngredient} onRemove={id => setIngredients(current => current.filter(item => item.id !== id))} /><StepsEditor steps={steps} onChange={setSteps} />{submissionError && <View className="rounded-xl border border-red-400/30 bg-red-950/30 px-4 py-3"><Text className="text-sm leading-5 text-red-100">Nie wysłano przepisu: {submissionError}</Text></View>}<Pressable disabled={isSubmitting} onPress={() => void handleSubmit()} className="h-13 flex-row items-center justify-center gap-2 rounded-full bg-lime-400 active:bg-lime-300 disabled:opacity-50">{isSubmitting ? <ActivityIndicator color="#111827" /> : <Send size={18} color="#111827" />}<Text className="font-bold text-neutral-950">Wyślij do weryfikacji</Text></Pressable></View></View></ScrollView>;
}

function IngredientsEditor({ingredients, phrase, onPhraseChange, suggestions, onAdd, onUpdate, onRemove}: {ingredients: IngredientDraft[]; phrase: string; onPhraseChange: (value: string) => void; suggestions: Doc<"products">[] | undefined; onAdd: (product: Doc<"products">) => void; onUpdate: (id: string, patch: Partial<IngredientDraft>) => void; onRemove: (id: string) => void}) {
    return <View><Text className="text-base font-semibold text-white">Składniki</Text><View className="mt-3 h-12 flex-row items-center rounded-xl border border-white/15 bg-white/5 px-3"><Search size={18} color="rgba(255,255,255,0.5)" /><TextInput value={phrase} onChangeText={onPhraseChange} className="ml-3 flex-1 text-base text-white" placeholder="Wyszukaj produkt…" placeholderTextColor="rgba(255,255,255,0.4)" /></View>{phrase.trim().length >= 2 && <View className="mt-2 overflow-hidden rounded-xl border border-white/10 bg-zinc-950">{suggestions === undefined ? <View className="p-4"><ActivityIndicator color="#a3e635" /></View> : suggestions.length ? suggestions.map(product => <Pressable key={product._id} onPress={() => onAdd(product)} className="flex-row items-center justify-between border-b border-white/5 px-4 py-3 last:border-b-0 active:bg-white/5"><Text className="text-white">{product.name}</Text><Plus size={17} color="#a3e635" /></Pressable>) : <Text className="p-4 text-sm text-white/50">Nie znaleziono produktu.</Text>}</View>}{ingredients.length > 0 && <View className="mt-4 gap-4">{ingredients.map(item => <View key={item.id} className="rounded-xl border border-white/10 bg-white/5 p-4"><View className="flex-row items-center justify-between"><Text className="flex-1 text-base font-semibold text-white">{item.product.name}</Text><Pressable onPress={() => onRemove(item.id)} className="size-8 items-center justify-center rounded-full active:bg-white/10"><Trash2 size={16} color="#fca5a5" /></Pressable></View><QuantityInputs label="Metryczne" quantity={item.metricQuantity} unit={item.metricUnit} units={metricUnits} onQuantityChange={metricQuantity => onUpdate(item.id, {metricQuantity})} onUnitChange={metricUnit => onUpdate(item.id, {metricUnit})} /><QuantityInputs label="Domowe" quantity={item.customaryQuantity} unit={item.customaryUnit} units={customaryUnits} onQuantityChange={customaryQuantity => onUpdate(item.id, {customaryQuantity})} onUnitChange={customaryUnit => onUpdate(item.id, {customaryUnit})} /></View>)}</View>}</View>;
}

function QuantityInputs<T extends string>({label, quantity, unit, units, onQuantityChange, onUnitChange}: {label: string; quantity: string; unit: T; units: readonly T[]; onQuantityChange: (value: string) => void; onUnitChange: (unit: T) => void}) {
    const [isUnitPickerOpen, setIsUnitPickerOpen] = useState(false);
    return (
        <View className="mt-4">
            <Text className="text-xs text-white/60">{label}</Text>
            <View className="mt-2 flex-row gap-3">
                <TextInput
                    accessibilityLabel={`Ilość: ${label.toLowerCase()}`}
                    value={quantity}
                    onChangeText={onQuantityChange}
                    keyboardType="decimal-pad"
                    className="h-12 w-24 rounded-xl border border-white/15 bg-black/30 px-3 text-base text-white"
                    style={{paddingVertical: 0, textAlignVertical: "center"}}
                />
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Wybierz jednostkę: ${label.toLowerCase()}`}
                    accessibilityValue={{text: unit}}
                    onPress={() => { Keyboard.dismiss(); setIsUnitPickerOpen(true); }}
                    className="h-12 flex-1 flex-row items-center justify-between rounded-xl border border-white/20 bg-black/30 px-4"
                >
                    <Text className="text-base font-medium text-white">{unit}</Text>
                    <ChevronDown size={19} color="#d9f99d" />
                </Pressable>
            </View>
            <Modal visible={isUnitPickerOpen} transparent animationType="fade" onRequestClose={() => setIsUnitPickerOpen(false)}>
                <View className="flex-1 justify-end bg-black/70">
                    <Pressable accessibilityRole="button" accessibilityLabel="Zamknij wybór jednostki" onPress={() => setIsUnitPickerOpen(false)} className="flex-1" />
                    <View className="rounded-t-3xl border border-white/15 bg-zinc-950 px-5 pb-8 pt-5" style={{maxHeight: "70%"}}>
                        <View className="mb-4 flex-row items-center justify-between">
                            <Text className="text-lg font-bold text-white">Wybierz jednostkę</Text>
                            <Pressable accessibilityRole="button" accessibilityLabel="Zamknij" onPress={() => setIsUnitPickerOpen(false)} className="p-2">
                                <X size={20} color="#fff" />
                            </Pressable>
                        </View>
                        <ScrollView keyboardShouldPersistTaps="always">
                            {units.map(option => (
                                <Pressable
                                    key={option}
                                    accessibilityRole="radio"
                                    accessibilityState={{checked: option === unit}}
                                    onPress={() => { onUnitChange(option); setIsUnitPickerOpen(false); }}
                                    className="min-h-12 flex-row items-center justify-between border-b border-white/10 px-2 py-3"
                                >
                                    <Text className={option === unit ? "text-base font-semibold text-lime-300" : "text-base text-white"}>{option}</Text>
                                    {option === unit && <Check size={20} color="#a3e635" />}
                                </Pressable>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

function StepsEditor({steps, onChange}: {steps: string[]; onChange: (steps: string[]) => void}) {
    return <View><View className="flex-row items-center justify-between"><Text className="text-base font-semibold text-white">Kroki przygotowania</Text><Pressable onPress={() => onChange([...steps, ""])} className="flex-row items-center gap-1 rounded-full bg-white/10 px-3 py-2"><Plus size={15} color="#a3e635" /><Text className="text-xs font-semibold text-lime-300">Dodaj krok</Text></Pressable></View><View className="mt-4 gap-3">{steps.map((step, index) => <View key={index} className="flex-row gap-3"><View className="mt-3 size-6 items-center justify-center rounded-full bg-white/10"><Text className="text-xs text-white">{index + 1}</Text></View><TextInput value={step} onChangeText={value => onChange(steps.map((current, stepIndex) => stepIndex === index ? value : current))} multiline textAlignVertical="top" className="min-h-22 flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-3 text-white" placeholder="Opisz ten krok…" placeholderTextColor="rgba(255,255,255,0.4)" />{steps.length > 1 && <Pressable onPress={() => onChange(steps.filter((_, stepIndex) => stepIndex !== index))} className="mt-2 size-8 items-center justify-center rounded-full active:bg-white/10"><X size={17} color="#fca5a5" /></Pressable>}</View>)}</View></View>;
}

function FormField({label, children}: {label: string; children: ReactNode}) {
    return <View><Text className="mb-2 text-sm font-medium text-white/80">{label}</Text>{children}</View>;
}
