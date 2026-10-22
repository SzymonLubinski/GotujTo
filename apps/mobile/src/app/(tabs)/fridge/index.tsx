import {useMemo, useState} from "react";
import {ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View} from "react-native";
import {useRouter} from "expo-router";
import {useMutation, useQuery, useConvexAuth} from "convex/react";
import {ArrowLeft, ChefHat, Plus, Search, Trash2, X} from "lucide-react-native";
import {api} from "@gotujto/convex/_generated/api";
import {type Doc} from "@gotujto/convex/_generated/dataModel";
import {Text} from "@/components/ui/text";
import {navigateAfterBlur} from "@/lib/navigation";
import {useToast} from "@/components/ui/toast";

export default function FridgeScreen() {
    const router = useRouter();
    const [phrase, setPhrase] = useState("");
    const [selectedProducts, setSelectedProducts] = useState<Doc<"products">[]>([]);
    const [suggestionsOpen, setSuggestionsOpen] = useState(false);
    const {isAuthenticated, isLoading: isAuthLoading} = useConvexAuth();
    const {toast} = useToast();
    const savedFridgeProducts = useQuery(
        api.userDashboard.getFridgeProducts,
        isAuthenticated ? {} : "skip",
    );
    const addFridgeProduct = useMutation(api.userDashboard.addFridgeProduct);
    const removeFridgeProduct = useMutation(api.userDashboard.removeFridgeProduct);
    const clearFridgeProducts = useMutation(api.userDashboard.clearFridgeProducts);

    const normalizedPhrase = phrase.trim();
    const suggestions = useQuery(
        api.products.searchProducts,
        normalizedPhrase.length >= 2 ? {phrase: normalizedPhrase} : "skip",
    );

    const products = useMemo(() => {
        return isAuthenticated
            ? savedFridgeProducts ?? []
            : selectedProducts;
    }, [isAuthenticated, savedFridgeProducts, selectedProducts]);
    const isFridgeLoading = isAuthenticated && savedFridgeProducts === undefined;

    const filteredSuggestions = useMemo(() => {
        return suggestions?.filter(product => {
            return !products.some(selectedProduct => {
                return selectedProduct._id === product._id;
            });
        });
    }, [products, suggestions]);

    const handlePhraseChange = (value: string) => {
        setPhrase(value);
        setSuggestionsOpen(true);
    };

    const handleClearSearch = () => {
        setPhrase("");
        setSuggestionsOpen(false);
    };

    const handleSelectProduct = (product: Doc<"products">) => {
        setPhrase("");
        setSuggestionsOpen(false);
        Keyboard.dismiss();

        if (isAuthenticated) {
            void addFridgeProduct({productId: product._id}).catch(() => {
                toast({title: "Nie udało się dodać produktu do lodówki.", variant: "destructive"});
            });
            return;
        }

        setSelectedProducts(currentProducts => [...currentProducts, product]);
    };

    const handleRemoveProduct = (productId: Doc<"products">["_id"]) => {
        if (isAuthenticated) {
            void removeFridgeProduct({productId}).catch(() => {
                toast({title: "Nie udało się usunąć produktu z lodówki.", variant: "destructive"});
            });
            return;
        }

        setSelectedProducts(currentProducts => {
            return currentProducts.filter(product => product._id !== productId);
        });
    };

    const handleClearProducts = () => {
        if (isAuthenticated) {
            void clearFridgeProducts().catch(() => {
                toast({title: "Nie udało się opróżnić lodówki.", variant: "destructive"});
            });
            return;
        }

        setSelectedProducts([]);
    };

    const handleShowRecipes = () => {
        navigateAfterBlur(() => {
            router.push({
                pathname: "/fridge/results",
                params: {
                    productId: products.map(product => product._id),
                },
            });
        });
    };

    const showSuggestions = suggestionsOpen && normalizedPhrase.length >= 2;

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
            return;
        }

        router.replace("/");
    };

    return (
        <KeyboardAvoidingView className="flex-1 bg-black"
                              behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScrollView className="flex-1"
                        contentContainerStyle={{paddingBottom: 120}}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                        onScrollBeginDrag={() => Keyboard.dismiss()}
            >
                <View className="px-5">
                    <View className="h-16 flex-row items-center border-b border-white/10">
                        <Pressable accessibilityRole="button"
                                   accessibilityLabel="Wróć"
                                   className="h-10 w-10 items-center justify-center rounded-full active:bg-white/10"
                                   onPress={handleBack}
                        >
                            <ArrowLeft size={21} color="white" />
                        </Pressable>

                        <Text className="flex-1 pr-10 text-center text-lg font-semibold text-white">
                            Mam w lodówce
                        </Text>
                    </View>

                    <View className="pt-7">
                        <Text className="text-3xl font-bold tracking-tight text-white">
                            Co masz w lodówce?
                        </Text>

                        <Text className="mt-2 text-sm text-white/60">
                            Wyszukaj i dodaj produkty, które masz.
                        </Text>

                        <View className="relative z-30 mt-6">
                            <View className="h-14 flex-row items-center rounded-2xl border border-white/15 bg-white/5 px-3">
                                <Search size={20} color="rgba(255, 255, 255, 0.4)" />

                                <TextInput value={phrase}
                                           className="h-full flex-1 px-3 text-base text-white"
                                           placeholder="Wyszukaj produkt..."
                                           placeholderTextColor="rgba(255, 255, 255, 0.4)"
                                           returnKeyType="search"
                                           autoCorrect={false}
                                           onFocus={() => setSuggestionsOpen(true)}
                                           onChangeText={handlePhraseChange}
                                />

                                {phrase.length > 0 && (
                                    <Pressable accessibilityRole="button"
                                               accessibilityLabel="Wyczyść wyszukiwanie"
                                               className="h-9 w-9 items-center justify-center rounded-full active:bg-white/10"
                                               onPress={handleClearSearch}
                                    >
                                        <X size={17} color="rgba(255, 255, 255, 0.6)" />
                                    </Pressable>
                                )}
                            </View>

                            {showSuggestions && (
                                <View className="absolute inset-x-0 top-16 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl">
                                    {suggestions === undefined && (
                                        <View className="flex-row items-center gap-3 px-4 py-4">
                                            <ActivityIndicator size="small" color="#a3e635" />
                                            <Text className="text-sm text-white/50">
                                                Wyszukiwanie...
                                            </Text>
                                        </View>
                                    )}

                                    {filteredSuggestions?.length === 0 && (
                                        <Text className="px-4 py-4 text-sm text-white/50">
                                            Nie znaleziono produktu.
                                        </Text>
                                    )}

                                    {filteredSuggestions?.map(product => (
                                        <Pressable key={product._id}
                                                   className="flex-row items-center justify-between border-b border-white/5 px-4 py-4 last:border-b-0 active:bg-white/5"
                                                   onPress={() => handleSelectProduct(product)}
                                        >
                                            <Text className="flex-1 pr-4 text-base text-white">
                                                {product.name}
                                            </Text>

                                            <Plus size={18} color="#a3e635" />
                                        </Pressable>
                                    ))}
                                </View>
                            )}
                        </View>

                        <View className="z-10 mt-8">
                            <View className="flex-row items-center justify-between">
                                <Text className="text-lg font-semibold text-white">
                                    Twoje produkty
                                </Text>

                                <View className="flex-row items-center gap-3">
                                    <Text className="text-sm text-white/50">
                                        {isFridgeLoading ? "…" : products.length}
                                    </Text>

                                    {products.length > 0 && (
                                        <Pressable
                                            accessibilityRole="button"
                                            accessibilityLabel="Usuń wszystkie produkty"
                                            onPress={handleClearProducts}
                                            className="flex-row items-center gap-1 rounded-full px-2 py-1 active:bg-red-400/10"
                                        >
                                            <Trash2 size={14} color="#fca5a5" />
                                            <Text className="text-xs font-medium text-red-300">Usuń wszystkie</Text>
                                        </Pressable>
                                    )}
                                </View>
                            </View>

                            {isFridgeLoading || isAuthLoading ? (
                                <View className="mt-4 min-h-24 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                                    <ActivityIndicator size="small" color="#a3e635" />
                                </View>
                            ) : products.length > 0 ? (
                                <View className="mt-4 flex-row flex-wrap gap-2"
                                      key="selected-products"
                                >
                                    {products.map(product => (
                                        <View key={product._id}
                                              className="flex-row items-center gap-2 rounded-full bg-white/10 py-2 pl-4 pr-2"
                                        >
                                            <Text className="text-sm text-white">
                                                {product.name}
                                            </Text>

                                            <Pressable accessibilityRole="button"
                                                       accessibilityLabel={`Usuń ${product.name}`}
                                                       className="h-6 w-6 items-center justify-center rounded-full active:bg-white/10"
                                                       onPress={() => handleRemoveProduct(product._id)}
                                            >
                                                <X size={14} color="rgba(255, 255, 255, 0.6)" />
                                            </Pressable>
                                        </View>
                                    ))}
                                </View>
                            ) : (
                                <View className="mt-4 items-center rounded-2xl border border-dashed border-white/15 px-5 py-10"
                                      key="empty-products"
                                >
                                    <Text className="text-sm text-white/50">
                                        Dodaj przynajmniej jeden produkt.
                                    </Text>
                                </View>
                            )}
                        </View>

                        <Pressable accessibilityRole="button"
                                   disabled={products.length === 0 || isFridgeLoading}
                                   className={products.length === 0 || isFridgeLoading
                                       ? "mt-10 h-14 w-full flex-row items-center justify-center gap-2 rounded-xl bg-white/10 will-change-pressable"
                                       : "mt-10 h-14 w-full flex-row items-center justify-center gap-2 rounded-xl bg-lime-400 active:bg-lime-300 will-change-pressable"
                                   }
                                   onPress={handleShowRecipes}
                        >
                            <ChefHat size={20}
                                     color={products.length === 0 || isFridgeLoading
                                         ? "rgba(255, 255, 255, 0.3)"
                                         : "#000000"
                                     }
                            />

                            <Text className={products.length === 0 || isFridgeLoading
                                ? "text-base font-semibold text-white/30"
                                : "text-base font-semibold text-black"
                            }>
                                Pokaż pasujące przepisy
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
