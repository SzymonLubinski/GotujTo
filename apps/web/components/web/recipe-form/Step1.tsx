'use client';

import {dietTypes, mealTypes, occasions} from "@gotujto/shared/data/stableData";
import ComboboxController from "@/components/controllers/ComboboxController";
import InputController from "@/components/controllers/InputController";
import NumberInputController from "@/components/controllers/NumberInputController";
import RecipeMediaFields from "@/components/web/recipe-form/RecipeMediaFields";

export default function Step1() {

    return (
        <div className="space-y-8">
            <InputController name={"step1.name"}
                             label={"Nazwa przepisu"}
                             placeholder={"Np. Spaghetti Carbonara"}
            />
            <div className="grid grid-cols-2 gap-6">
                <NumberInputController name={"step1.cookingMinutes"}
                                       label={"Czas przygotowania (min)"}
                />
                <NumberInputController name={"step1.servings"}
                                       label={"Liczba porcji"}
                />
            </div>

            <ComboboxController
                name="step1.diets"
                label="Diety"
                items={dietTypes.map(item => ({key: item}))}
            />

            <ComboboxController
                name="step1.types"
                label="Typ posiłku"
                items={mealTypes.map(item => ({key: item}))}
            />

            <ComboboxController
                name="step1.occasions"
                label="Okazje"
                items={occasions.map(item => ({key: item}))}
            />

            <RecipeMediaFields/>

        </div>
    );
}
