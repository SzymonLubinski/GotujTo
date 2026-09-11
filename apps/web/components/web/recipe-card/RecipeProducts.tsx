"use client";

import {useState} from "react";
import {ArrowRight, Check, RefreshCw, Tag} from "lucide-react";
import {Badge} from "@/components/ui/badge";
import {Separator} from "@/components/ui/separator";
import {Button} from "@/components/ui/button";
import {type RecipeResultsType} from "@gotujto/shared/types/result-type";

type RecipeResult = NonNullable<RecipeResultsType>;
type IngredientGroup =
    RecipeResult["ingredientGroups"][number];
type Ingredient =
    IngredientGroup["ingredients"][number];

type RecipeProductsProps = {
    ingredientGroups: RecipeResult["ingredientGroups"];
    unitSystem: "metric" | "customary";
};

export default function RecipeProducts({ingredientGroups, unitSystem}: RecipeProductsProps) {
    const [selectedIndexes, setSelectedIndexes] =
        useState<Record<number, number>>({});

    const selectNextIngredient = (
        group: number,
        ingredientsCount: number,
    ) => {
        setSelectedIndexes(current => {
            const currentIndex =
                current[group] ?? 0;

            return {
                ...current,
                [group]:
                    (currentIndex + 1) %
                    ingredientsCount,
            };
        });
    };

    const getIngredientQuantity = (
        ingredient: Ingredient,
    ) => {
        const quantity =
            unitSystem === "metric"
                ? ingredient.metricQuantity
                : ingredient.customaryQuantity;

        const unit =
            unitSystem === "metric"
                ? ingredient.metricUnit
                : ingredient.customaryUnit;

        return [quantity, unit]
            .filter(value =>
                value !== null &&
                value !== undefined,
            )
            .join(" ");
    };

    return (
        <ul>
            {ingredientGroups.map((group, index) => {
                const selectedIndex =
                    selectedIndexes[group.group] ?? 0;

                const ingredient =
                    group.ingredients[selectedIndex] ??
                    group.ingredients[0];

                if (!ingredient) {
                    return null;
                }

                const quantity =
                    getIngredientQuantity(ingredient);
                const hasSubstitutes =
                    group.ingredients.length > 1;

                return (
                    <li key={group.group}>
                        <div className="flex min-h-18 items-center gap-4 px-4 py-3 sm:px-5">
                            <span
                                className={
                                    ingredient.inFridge
                                        ? "flex size-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                                        : ingredient.inDeal
                                            ? "flex size-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400"
                                            : "flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
                                }
                            >
                                    {ingredient.inFridge ? (
                                        <Check className="size-4"/>
                                    ) : ingredient.inDeal ? (
                                        <Tag className="size-4"/>
                                    ) : (
                                        <ArrowRight className="size-4"/>
                                    )}
                                </span>

                            <div className="min-w-0 flex-1">
                                <p className="text-foreground">
                                    {quantity && (
                                        <span className="font-semibold">
                                            {quantity}{" "}
                                        </span>
                                    )}

                                    <span>
                                        {ingredient.productName}
                                    </span>
                                </p>

                                <div className="mt-1 flex flex-wrap gap-2">
                                    {ingredient.inFridge && (
                                        <Badge variant="secondary">
                                            W lodówce
                                        </Badge>
                                    )}

                                    {ingredient.inDeal && (
                                        <Badge variant="secondary">
                                            Promocja
                                        </Badge>
                                    )}

                                    {ingredient.optional && (
                                        <Badge variant="secondary">
                                            Opcjonalnie
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            {hasSubstitutes && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        selectNextIngredient(
                                            group.group,
                                            group.ingredients.length,
                                        )
                                    }
                                    aria-label="Zmień składnik na zamiennik"
                                >
                                    <RefreshCw className="size-4"/>

                                    <span className="hidden sm:inline">
                                        Zamień
                                    </span>

                                    <span className="text-xs text-muted-foreground">
                                        {selectedIndex + 1}/
                                        {group.ingredients.length}
                                    </span>
                                </Button>
                            )}
                        </div>

                        {index <
                            ingredientGroups.length - 1 && (
                                <Separator/>
                            )}
                    </li>
                );
            })}
        </ul>
    );
}