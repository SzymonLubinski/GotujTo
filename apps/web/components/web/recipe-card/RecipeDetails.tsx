"use client";

import {useState} from "react";
import {Clock, Ruler, CakeSlice, ChefHat } from "lucide-react";
import {Card, CardContent} from "@/components/ui/card";
import {Progress} from "@/components/ui/progress";
import {ToggleGroup, ToggleGroupItem} from "@/components/ui/toggle-group";
import RecipeProducts from "@/components/web/recipe-card/RecipeProducts";
import RecipeSteps from "@/components/web/recipe-card/RecipeSteps";
import {RecipeHeader} from "@/components/web/recipe-card/RecipeHeader";
import {RecipeHeaderNavigation} from "@/components/web/recipe-card/RecipeNav";
import {type RecipeResultsType} from "@gotujto/shared/types/result-type";

type UnitSystem = "metric" | "customary";

type RecipeDetailsProps = {
    result: RecipeResultsType;
};

export function RecipeDetails({result}: RecipeDetailsProps) {
    const [unitSystem, setUnitSystem] =
        useState<UnitSystem>("customary");

    if (!result) {
        return <div>Nie znaleziono przepisu.</div>;
    }

    const {
        recipe,
        steps,
        ingredientGroups,
    } = result;

    const fridgeIngredients = ingredientGroups.filter(
        group => group.ingredients[0]?.inFridge === true,
    ).length;

    const hasFridgeProducts =
        fridgeIngredients > 0;

    const matchPercentage =
        ingredientGroups.length > 0
            ? Math.round(
                (
                    fridgeIngredients /
                    ingredientGroups.length
                ) * 100,
            )
            : 0;

    const fallbackImage =
        "https://images.unsplash.com/photo-1761019646782-4bc46ba43fe9?q=80&w=1631&auto=format&fit=crop";

    const images =
        recipe.images?.length
            ? recipe.images
            : [fallbackImage];

    return (
        <article className="mx-auto min-h-screen w-full max-w-3xl bg-background pb-16 lg:max-w-6xl lg:px-8 lg:py-10">
            <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start lg:gap-10">
                <div className="relative min-w-0 lg:sticky lg:top-8">
                    <RecipeHeaderNavigation />

                    <RecipeHeader
                        title={recipe.name}
                        images={images}
                        videoUrl={recipe.videoKey}
                    />
                </div>

                <section className="min-w-0 space-y-6 px-5 py-8 sm:px-8 lg:p-0">
                    <h2 className="text-2xl font-bold tracking-tight">
                        {recipe.name}
                    </h2>

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-white/90 sm:text-base">
                        <div className="flex items-center gap-3">
                            <Clock className="size-5" />
                            <span>
                                {recipe.cookingMinutes} min
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            <CakeSlice className="size-5" />
                            <span>
                                {recipe.servings} porcji
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <ChefHat className="size-5" />
                            <span>
                                {recipe.authorId}
                            </span>
                        </div>
                    </div>
                    {recipe.description && (
                        <p className="whitespace-pre-line leading-7 text-muted-foreground">
                            {recipe.description}
                        </p>
                    )}
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                        <div className="space-y-1">
                            {hasFridgeProducts && (
                                <p className="text-sm text-muted-foreground">
                                    Masz {fridgeIngredients} z{" "}
                                    {ingredientGroups.length} składników
                                </p>
                            )}

                            <h3 className="text-xl font-bold tracking-tight">
                                Składniki
                            </h3>
                        </div>

                        <div className="flex flex-col items-start gap-2 sm:items-end">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Ruler className="size-4" />
                                <span>Jednostki</span>
                            </div>

                            <ToggleGroup
                                type="single"
                                value={unitSystem}
                                onValueChange={value => {
                                    if (value) {
                                        setUnitSystem(
                                            value as UnitSystem,
                                        );
                                    }
                                }}
                                variant="outline"
                                size="sm"
                            >
                                <ToggleGroupItem
                                    value="metric"
                                    aria-label="Pokaż jednostki metryczne"
                                >
                                    Metryczne
                                </ToggleGroupItem>

                                <ToggleGroupItem
                                    value="customary"
                                    aria-label="Pokaż jednostki użytkowe"
                                >
                                    Użytkowe
                                </ToggleGroupItem>
                            </ToggleGroup>
                        </div>
                    </div>

                    {hasFridgeProducts && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Dopasowanie składników
                                </span>

                                <span className="font-semibold">
                                    {matchPercentage}%
                                </span>
                            </div>

                            <Progress
                                value={matchPercentage}
                                aria-label={`Dopasowanie składników ${matchPercentage}%`}
                            />
                        </div>
                    )}

                    <Card className="overflow-hidden py-0">
                        <CardContent className="p-0">
                            <RecipeProducts
                                ingredientGroups={ingredientGroups}
                                unitSystem={unitSystem}
                            />
                        </CardContent>
                    </Card>
                </section>
            </div>

            <div className="px-5 pt-4 sm:px-8 lg:mx-auto lg:mt-12 lg:max-w-3xl lg:px-0 lg:pt-0">
                <RecipeSteps steps={steps} />
            </div>
        </article>
    );
}