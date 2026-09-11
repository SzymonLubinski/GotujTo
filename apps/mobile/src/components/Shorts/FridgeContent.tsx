import {Text, View} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import {type ShortItemData} from "@gotujto/shared/types/result-type";
import StandardContent from "./StandardContent";

type FridgeItem = Extract<ShortItemData, {source: "fridge"}>;

type FridgeContentProps = {
    item: FridgeItem;
    onOpenRecipe: () => void;
};

export default function FridgeContent({item, onOpenRecipe}: FridgeContentProps) {
    const matchedCount = getGroupCount(item.matchedGroups);
    const requiredCount = getGroupCount(item.requiredGroups);
    const topContent = (
        <View className="flex-row items-center gap-2 rounded-full border border-emerald-300/40 bg-emerald-600/90 px-4 py-2">
            <Ionicons name="checkmark-circle" size={19} color="white" />
            <Text className="text-sm font-bold uppercase tracking-wide text-white">
                Dopasowanie {Math.round(item.matchPercentage)}%
            </Text>
        </View>
    )
    const sourceInfo = (
        <View className="py-1">
            <Text className="font-semibold text-white">
                Masz w lodówce {matchedCount} z {requiredCount} wymaganych składników
            </Text>
        </View>
    )

    return (
        <StandardContent recipe={item.recipe}
                         topContent={topContent}
                         sourceInfo={sourceInfo}
                         onOpenRecipe={onOpenRecipe}
        />
    );
}

function getGroupCount(groups: unknown): number {
    if (Array.isArray(groups)) {
        return groups.length;
    }

    return typeof groups === "number" ? groups : 0;
}