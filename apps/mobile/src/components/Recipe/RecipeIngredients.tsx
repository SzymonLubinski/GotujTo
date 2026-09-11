import {useState} from "react";
import {Pressable, View} from "react-native";
import {ArrowRight, Check, RefreshCw, Refrigerator, Tag} from "lucide-react-native";
import {type RecipeResultsType} from "@gotujto/shared/types/result-type";
import {Text} from "@/components/ui/text";
import {UnitSystem} from "@/components/Recipe/UnitSystemToggle";

type RecipeResult = NonNullable<RecipeResultsType>;

type IngredientGroup =
    RecipeResult["ingredientGroups"][number];

type RecipeIngredient =
    IngredientGroup["ingredients"][number];

type RecipeIngredientsProps = {
    ingredientGroups: RecipeResult["ingredientGroups"];
    dealProductIds: ReadonlySet<string>;
    unitSystem: UnitSystem;
};

export default function RecipeIngredients({ingredientGroups, dealProductIds, unitSystem}: RecipeIngredientsProps) {
    const [selectedIngredientIds, setSelectedIngredientIds] =
        useState<Record<number, string>>({});

    const selectNextIngredient = (
        group: number,
        ingredients: RecipeIngredient[],
        selectedIngredientId: string,
    ) => {
        const selectedIndex = ingredients.findIndex(
            ingredient => ingredient._id === selectedIngredientId,
        );

        const nextIndex =
            (selectedIndex + 1) % ingredients.length;

        setSelectedIngredientIds(current => ({
            ...current,
            [group]: ingredients[nextIndex]._id,
        }));
    };

    return (
        <View className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            {ingredientGroups.map((ingredientGroup, index) => {
                const defaultIngredient =
                    ingredientGroup.ingredients[0];

                if (!defaultIngredient) {
                    return null;
                }

                const selectedIngredientId =
                    selectedIngredientIds[ingredientGroup.group] ??
                    defaultIngredient._id;

                const selectedIngredient =
                    ingredientGroup.ingredients.find(
                        ingredient =>
                            ingredient._id === selectedIngredientId,
                    ) ?? defaultIngredient;

                const quantity = getIngredientQuantity(
                    selectedIngredient,
                    unitSystem,
                );

                const onDeal = dealProductIds.has(
                    selectedIngredient.productId,
                );

                const hasAlternatives =
                    ingredientGroup.ingredients.length > 1;

                return (
                    <View
                        key={ingredientGroup.group}
                        className={
                            index < ingredientGroups.length - 1
                                ? "min-h-20 flex-row items-center gap-3 border-b border-white/10 px-4 py-3"
                                : "min-h-20 flex-row items-center gap-3 px-4 py-3"
                        }
                    >
                        <View
                            className={
                                selectedIngredient.owned
                                    ? "h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20"
                                    : onDeal
                                        ? "h-9 w-9 items-center justify-center rounded-full bg-orange-500/20"
                                        : "h-9 w-9 items-center justify-center rounded-full bg-white/10"
                            }
                        >
                            {selectedIngredient.owned ? (
                                <Check
                                    size={18}
                                    color="#34d399"
                                    strokeWidth={2.5}
                                />
                            ) : onDeal ? (
                                <Tag
                                    size={17}
                                    color="#fb923c"
                                />
                            ) : (
                                <ArrowRight
                                    size={17}
                                    color="rgba(255, 255, 255, 0.45)"
                                />
                            )}
                        </View>

                        <View className="flex-1">
                            <Text className="text-base text-white">
                                {quantity && (
                                    <Text className="font-bold text-white">
                                        {quantity}{" "}
                                    </Text>
                                )}

                                {selectedIngredient.productName}
                            </Text>

                            <View className="mt-1.5 flex-row flex-wrap gap-2">
                                {selectedIngredient.owned && (
                                    <IngredientBadge
                                        label="W lodówce"
                                        icon="fridge"
                                    />
                                )}

                                {onDeal && (
                                    <IngredientBadge
                                        label="Promocja"
                                        icon="deal"
                                    />
                                )}

                                {selectedIngredient.optional && (
                                    <View className="rounded-full bg-white/10 px-2.5 py-1">
                                        <Text className="text-xs font-medium text-white/60">
                                            Opcjonalnie
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        {hasAlternatives && (
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="Pokaż kolejny zamiennik"
                                onPress={() =>
                                    selectNextIngredient(
                                        ingredientGroup.group,
                                        ingredientGroup.ingredients,
                                        selectedIngredient._id,
                                    )
                                }
                                className="h-10 w-10 items-center justify-center rounded-full bg-white/10 active:bg-white/20 will-change-pressable"
                            >
                                <RefreshCw
                                    size={18}
                                    color="#ffffff"
                                />
                            </Pressable>
                        )}
                    </View>
                );
            })}
        </View>
    );
}

function getIngredientQuantity(ingredient: RecipeIngredient, unitSystem: UnitSystem): string {
    const quantity =
        unitSystem === "metric"
            ? ingredient.metricQuantity
            : ingredient.customaryQuantity;

    const unit =
        unitSystem === "metric"
            ? ingredient.metricUnit
            : ingredient.customaryUnit;

    return [quantity, unit]
        .filter(
            value =>
                value !== null &&
                value !== undefined,
        )
        .join(" ");
}

type IngredientBadgeProps = {
    label: string;
    icon: "fridge" | "deal";
};

function IngredientBadge({label, icon}: IngredientBadgeProps) {
    const isFridge = icon === "fridge";

    return (
        <View
            className={
                isFridge
                    ? "flex-row items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1"
                    : "flex-row items-center gap-1 rounded-full bg-orange-500/15 px-2.5 py-1"
            }
        >
            {isFridge ? (
                <Refrigerator
                    size={12}
                    color="#34d399"
                />
            ) : (
                <Tag
                    size={12}
                    color="#fb923c"
                />
            )}

            <Text
                className={
                    isFridge
                        ? "text-xs font-semibold text-emerald-400"
                        : "text-xs font-semibold text-orange-400"
                }
            >
                {label}
            </Text>
        </View>
    );
}